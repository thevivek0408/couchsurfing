import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USER_TITLE_SKELETON_TEST_ID } from "components/UserSummary";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getEventAttendees, getLiteUsers } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import EventAttendees from "./EventAttendees";

const { t } = i18n;

const listEventAttendeesMock = service.events
  .listEventAttendees as jest.MockedFunction<
  typeof service.events.listEventAttendees
>;
const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<
  typeof service.user.getLiteUsers
>;

describe("Event attendees", () => {
  beforeEach(() => {
    getLiteUsersMock.mockImplementation(getLiteUsers);
    listEventAttendeesMock.mockImplementation(getEventAttendees);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the attendees successfully", async () => {
    render(<EventAttendees eventId={1} />, { wrapper });

    expect(
      await screen.findByRole("heading", { name: t("communities:attendees") }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", {
        name: "Funny Cat current User, 28",
      }),
    ).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "Funny Chicken, 28" }),
    ).toBeVisible();
  });

  describe("when there are multiple pages of attendees", () => {
    beforeEach(() => {
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return getEventAttendees();
        }
        return {
          attendeeUserIdsList: [2, 3],
          nextPageToken: "3",
        };
      });
    });

    it("should show dialog for seeing all attendees when the 'See all' button is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );
      expect(
        await screen.findByRole("dialog", { name: t("communities:attendees") }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Dog, 35" }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Kid, 28" }),
      ).toBeVisible();
    });

    it("should load the next page of attendees when the 'Load more attendees' button is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );
      const dialog = within(
        await screen.findByRole("dialog", { name: t("communities:attendees") }),
      );

      await user.click(
        dialog.getByRole("button", {
          name: t("communities:load_more_attendees"),
        }),
      );

      expect(
        await screen.findByRole("heading", {
          name: "Funny Cat current User, 28",
        }),
      ).toBeVisible();
      expect(
        await screen.findByRole("heading", { name: "Funny Chicken, 28" }),
      ).toBeVisible();
    });

    it("should hide unknown users in the dialog", async () => {
      listEventAttendeesMock.mockImplementation(async ({ pageToken }) => {
        if (pageToken) {
          return {
            attendeeUserIdsList: [99],
            nextPageToken: "",
          };
        }
        return {
          attendeeUserIdsList: [4, 5],
          nextPageToken: "4",
        };
      });
      render(<EventAttendees eventId={1} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );

      const dialog = within(
        await screen.findByRole("dialog", { name: t("communities:attendees") }),
      );

      await user.click(
        await dialog.findByRole("button", {
          name: t("communities:load_more_attendees"),
        }),
      );

      await waitFor(() =>
        expect(
          dialog.queryByTestId(USER_TITLE_SKELETON_TEST_ID),
        ).not.toBeInTheDocument(),
      );
    });

    it("should show an error alert in the dialog if getting attendees failed", async () => {
      mockConsoleError();
      render(<EventAttendees eventId={1} />, { wrapper });
      const errorMessage = "Error listing attendees";
      listEventAttendeesMock.mockRejectedValue(new Error(errorMessage));

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );

      await screen.findByRole("dialog", { name: t("communities:attendees") });
      await assertErrorAlert(errorMessage);
    });

    it("closes the dialog when the backdrop is clicked", async () => {
      render(<EventAttendees eventId={1} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", { name: t("communities:see_all") }),
      );
      await screen.findByRole("dialog", { name: t("communities:attendees") });

      await user.click(document.querySelector(".MuiBackdrop-root")!);

      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: t("communities:attendees") }),
      );

      expect(
        screen.queryByRole("button", {
          name: t("communities:load_more_attendees"),
        }),
      ).not.toBeInTheDocument();
    });
  });
});
