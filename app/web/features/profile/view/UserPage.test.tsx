import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { User } from "proto/api_pb";
import React from "react";
import { routeToUser } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLanguages, getRegions, getUser } from "test/serviceMockDefaults";
import { addDefaultUser, MockedService } from "test/utils";

import { sectionLabels } from "../constants";
import UserPage from "./UserPage";

const { t } = i18n;

jest.mock("features/userQueries/useCurrentUser");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const reportContentMock = service.reporting.reportContent as MockedService<
  typeof service.reporting.reportContent
>;

const getLanguagesMock = service.resources.getLanguages as jest.MockedFunction<
  typeof service.resources.getLanguages
>;

const getRegionsMock = service.resources.getRegions as jest.MockedFunction<
  typeof service.resources.getRegions
>;

const useCurrentUserMock = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

function renderUserPage(username: string) {
  mockRouter.setCurrentUrl(routeToUser(username));
  render(<UserPage username={username} tab="about" />, { wrapper });
}

describe("User page", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    reportContentMock.mockResolvedValue(new Empty());
    getLanguagesMock.mockImplementation(getLanguages);
    getRegionsMock.mockImplementation(getRegions);
    addDefaultUser();
  });

  describe("when viewing the current user's profile", () => {
    beforeEach(() => {
      useCurrentUserMock.mockReturnValue({
        data: {
          username: "funnycat",
        } as User.AsObject,
        isError: false,
        isLoading: false,
        isFetching: false,
        error: "",
      });
    });

    it("does not show the button for opening a profile actions menu (viewed with username)", async () => {
      renderUserPage("funnycat");

      expect(
        await screen.findByRole("heading", { name: "Funny Cat current User" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", {
          name: t("profile:more_profile_actions_a11y_text"),
        }),
      ).not.toBeInTheDocument();
    });

    describe("and a tab is opened", () => {
      it("updates the url with the chosen tab value", async () => {
        renderUserPage("funnycat");

        expect(mockRouter.pathname).toBe("/user/funnycat");

        const user = userEvent.setup();

        await user.click(await screen.findByText(sectionLabels(t).home));

        expect(mockRouter.pathname).toBe("/user/funnycat/home");

        // @TODO(NA) For the life of me cannot get this second click to work after mui v5 upgrade
        // It works in the real app though. Giving up for now.
        // Mui introduced support for Next.js AppRouter, but we need to upgrade to Next v13 first for it, that might help
        // https://github.com/mui/material-ui/blob/HEAD/CHANGELOG.old.md#5140

        // await user.click(await screen.findByText(sectionLabels(t).about));

        // expect(mockRouter.pathname).toBe("/user/funnycat/about");
      });
    });
  });

  describe("when viewing another user's profile and a tab is opened", () => {
    beforeEach(() => {
      renderUserPage("funnydog");
    });

    it("updates the url with the chosen tab value", async () => {
      expect(mockRouter.pathname).toBe("/user/funnydog");

      const user = userEvent.setup();

      await user.click(await screen.findByText(sectionLabels(t).home));

      expect(mockRouter.pathname).toBe("/user/funnydog/home");

      // @TODO(NA) For the life of me cannot get this second click to work after mui v5 upgrade
      // It works in the real app though. Giving up for now.
      // Mui introduced support for Next.js AppRouter, but we need to upgrade to Next v13 first for it, that might help
      // https://github.com/mui/material-ui/blob/HEAD/CHANGELOG.old.md#5140

      // await user.click(await screen.findByText(sectionLabels(t).about));

      // expect(mockRouter.pathname).toBe("/user/funnydog/about");
    });

    describe("and the 'report user' option is clicked", () => {
      beforeEach(async () => {
        const user = userEvent.setup();
        await user.click(
          await screen.findByRole("button", {
            name: t("global:report.flag.button_aria_label"),
          }),
        );
      });

      it("opens the report user dialog", async () => {
        expect(
          await screen.findByRole("heading", {
            name: t("global:report.flag.title"),
          }),
        ).toBeVisible();
      });

      it("closes the report user dialog if the 'Cancel' button is clicked", async () => {
        const user = userEvent.setup();

        await user.click(
          await screen.findByRole("button", { name: t("global:cancel") }),
        );

        await waitForElementToBeRemoved(
          screen.getByRole("heading", {
            name: t("global:report.flag.title"),
          }),
        );
        expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
      });

      it("reports the user successfully", async () => {
        const reason = "Dating / Flirting";
        const description = "I feel very uncomfortable around this creepy dog";

        const user = userEvent.setup();

        await user.selectOptions(
          await screen.findByLabelText(t("global:report.flag.reason_label")),
          reason,
        );
        await user.type(
          screen.getByLabelText(t("global:report.flag.description_label")),
          description,
        );
        await user.click(
          screen.getByRole("button", { name: t("global:submit") }),
        );

        const successAlert = await screen.findByRole("alert");
        expect(
          within(successAlert).getByText(t("global:report.flag.success")),
        ).toBeVisible();
        expect(reportContentMock).toHaveBeenCalledTimes(1);
        expect(reportContentMock).toHaveBeenCalledWith({
          authorUser: 2,
          contentRef: "profile/2",
          description,
          reason,
        });
      });

      it("does not submit the user report if the required fields are not filled in", async () => {
        const user = userEvent.setup();

        await user.click(
          screen.getByRole("button", { name: t("global:submit") }),
        );

        expect(
          await screen.findByText(t("global:report.flag.reason_required")),
        ).toBeVisible();
        expect(reportContentMock).not.toHaveBeenCalled();
      });

      it("shows an error alert if the report user request failed to submit", async () => {
        jest.spyOn(console, "error").mockReturnValue(undefined);
        reportContentMock.mockRejectedValue(new Error("API error"));
        const reason = "Dating / Flirting";
        const description = " ";

        const user = userEvent.setup();

        await user.selectOptions(
          await screen.findByLabelText(t("global:report.flag.reason_label")),
          reason,
        );
        await user.type(
          screen.getByLabelText(t("global:report.flag.description_label")),
          description,
        );
        await user.click(
          screen.getByRole("button", { name: t("global:submit") }),
        );

        const errorAlert = await screen.findByRole("alert");
        expect(within(errorAlert).getByText("API error")).toBeVisible();
      });
    });
  });
});
