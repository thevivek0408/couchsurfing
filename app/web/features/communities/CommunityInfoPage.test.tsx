import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import mockRouter from "next-router-mock";
import { routeToCommunity, routeToEditCommunityPage } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUsers, listCommunityAdmins } from "test/serviceMockDefaults";
import { assertErrorAlert, keyPress, mockConsoleError } from "test/utils";

import CommunityInfoPage from "./CommunityInfoPage";

const { t } = i18n;

const listAdminsMock = service.communities.listAdmins as jest.MockedFunction<
  typeof service.communities.listAdmins
>;
const getLiteUsersMock = service.user.getLiteUsers as jest.MockedFunction<
  typeof service.user.getLiteUsers
>;
const [, firstAdmin, secondAdmin, thirdAdmin] = users;

async function assertAdminsShown(
  element: typeof screen | ReturnType<typeof within>,
) {
  expect(
    await element.findByRole("link", {
      name: getProfileLinkA11yLabel(firstAdmin.name),
    }),
  ).toBeVisible();
  expect(
    element.getByText(`${firstAdmin.name}, ${firstAdmin.age}`),
  ).toBeVisible();
  expect(
    element.getByRole("link", {
      name: getProfileLinkA11yLabel(secondAdmin.name),
    }),
  ).toBeVisible();
  expect(
    element.getByText(`${secondAdmin.name}, ${secondAdmin.age}`),
  ).toBeVisible();
}

describe("Community info page", () => {
  beforeEach(() => {
    getLiteUsersMock.mockImplementation(getLiteUsers);
    listAdminsMock.mockImplementation(listCommunityAdmins);
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "http://mymedia.com";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the info page correctly", async () => {
    render(<CommunityInfoPage community={community} />, { wrapper });

    // General information heading checks

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: t("communities:local_info_title", { name: community.name }),
        }),
      ).toBeVisible();
    });
    expect(screen.getByText(community.mainPage.content)).toBeVisible();

    // Shouldn't show the edit link since the default user doesn't have permission
    expect(
      screen.queryByRole("link", { name: t("global:edit") }),
    ).not.toBeInTheDocument();

    // Community moderators section checks
    expect(
      screen.getByRole("heading", {
        name: t("communities:community_moderators"),
      }),
    ).toBeVisible();

    await assertAdminsShown(screen);

    // Shouldn't show "see all moderators" button since the page already shows
    // everyone in this case
    expect(
      screen.queryByRole("button", {
        name: t("communities:see_all_moderators"),
      }),
    ).not.toBeInTheDocument();
  });

  describe("when the user has permission to edit a community info page", () => {
    it("takes the user to the edit community info page when such a link is clicked", async () => {
      mockRouter.setCurrentUrl(
        routeToCommunity(community.communityId, community.slug, "info"),
      );
      render(
        <CommunityInfoPage
          community={{
            ...community,
            mainPage: { ...community.mainPage, canEdit: true },
          }}
        />,
        { wrapper },
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const editLink = screen.getByRole("link", { name: t("global:edit") });
      expect(editLink).toBeVisible();

      const user = userEvent.setup();

      await user.click(editLink);

      await waitFor(() =>
        expect(mockRouter.pathname).toBe(
          routeToEditCommunityPage(community.communityId, community.slug),
        ),
      );
    });
  });

  it("shows an error alert if the community moderators fails to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing admins";
    listAdminsMock.mockRejectedValue(new Error(errorMessage));
    render(<CommunityInfoPage community={community} />, { wrapper });

    await assertErrorAlert(errorMessage);

    expect(
      screen.queryByText(t("communities:no_moderators")),
    ).not.toBeInTheDocument();
  });

  describe("when there are more than one page of moderators", () => {
    it("should show a 'See all moderators' button which opens a dialog when clicked", async () => {
      listAdminsMock.mockResolvedValue({
        adminUserIdsList: [2, 3],
        nextPageToken: "3",
      });
      render(<CommunityInfoPage community={community} />, { wrapper });
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", {
          name: t("communities:see_all_moderators"),
        }),
      );
      const adminDialog = within(
        await screen.findByRole("dialog", {
          name: t("communities:community_moderators"),
        }),
      );

      expect(
        adminDialog.getByRole("heading", {
          name: t("communities:community_moderators"),
        }),
      ).toBeVisible();
      await assertAdminsShown(adminDialog);
      expect(
        adminDialog.getByRole("button", {
          name: t("communities:load_more_moderators"),
        }),
      ).toBeVisible();
    });
  });

  describe("when the moderators dialog is opened", () => {
    beforeEach(async () => {
      listAdminsMock.mockResolvedValue({
        adminUserIdsList: [2, 3],
        nextPageToken: "3",
      });
      render(<CommunityInfoPage community={community} />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: t("communities:see_all_moderators"),
          }),
        ).toBeVisible();
      });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", {
          name: t("communities:see_all_moderators"),
        }),
      );
      await screen.findByRole("dialog", {
        name: t("communities:community_moderators"),
      });
    });

    it("loads more moderators when the button is clicked", async () => {
      listAdminsMock.mockResolvedValue({
        adminUserIdsList: [4],
        nextPageToken: "",
      });

      const user = userEvent.setup();

      await user.click(
        screen.getByRole("button", {
          name: t("communities:load_more_moderators"),
        }),
      );

      const adminDialog = within(
        await screen.findByRole("dialog", {
          name: t("communities:community_moderators"),
        }),
      );
      assertAdminsShown(adminDialog);
      expect(
        await adminDialog.findByRole("link", {
          name: getProfileLinkA11yLabel(thirdAdmin.name),
        }),
      ).toBeVisible();
      expect(
        adminDialog.getByText(`${thirdAdmin.name}, ${thirdAdmin.age}`),
      ).toBeVisible();

      // Check it doesn't affect the underlying page
      await user.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", {
          name: t("communities:community_moderators"),
        }),
      );
      await waitFor(() =>
        expect(
          adminDialog.queryByRole("link", {
            name: getProfileLinkA11yLabel(thirdAdmin.name),
          }),
        ).not.toBeInTheDocument(),
      );
      expect(adminDialog.queryByRole(thirdAdmin.name)).not.toBeInTheDocument();
    });

    it("closes the dialog by clicking the backdrop", async () => {
      const user = userEvent.setup();

      await user.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", {
          name: t("communities:community_moderators"),
        }),
      );

      await waitFor(() =>
        expect(
          screen.queryByRole("button", {
            name: t("communities:load_more_moderators"),
          }),
        ).not.toBeInTheDocument(),
      );
    });

    it("closes the dialog by pressing the escape key", async () => {
      keyPress(
        screen.getByRole("dialog", {
          name: t("communities:community_moderators"),
        }),
        {
          key: "Escape",
          code: "Escape",
        },
      );
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", {
          name: t("communities:community_moderators"),
        }),
      );

      await waitFor(() =>
        expect(
          screen.queryByRole("button", {
            name: t("communities:load_more_moderators"),
          }),
        ).not.toBeInTheDocument(),
      );
    });
  });
});
