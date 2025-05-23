import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { service } from "service";
import community from "test/fixtures/community.json";
import discussions from "test/fixtures/discussions.json";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getLiteUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import { DISCUSSION_CARD_TEST_ID } from "./DiscussionCard";
import DiscussionsListPage from "./DiscussionsListPage";

const { t } = i18n;

jest.mock("components/MarkdownInput");

const getLiteUserMock = service.user.getLiteUser as MockedService<
  typeof service.user.getLiteUser
>;
const createDiscussionMock = service.discussions
  .createDiscussion as MockedService<
  typeof service.discussions.createDiscussion
>;
const listDiscussionsMock = service.communities
  .listDiscussions as MockedService<typeof service.communities.listDiscussions>;

describe("DiscussionsListPage", () => {
  beforeEach(() => {
    getLiteUserMock.mockImplementation(getLiteUser);
    listDiscussionsMock.mockResolvedValue({
      discussionsList: discussions,
      nextPageToken: "",
    });
  });
  it("renders a list of discussion", async () => {
    render(<DiscussionsListPage community={community} />, { wrapper });
    // Initial loading state
    expect(screen.getByRole("progressbar")).toBeVisible();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    const discussionCards = (
      await screen.findAllByTestId(DISCUSSION_CARD_TEST_ID)
    ).map((element) => within(element));

    const firstCreator = await getLiteUser(
      discussions[0].creatorUserId.toString(),
    );
    expect(
      discussionCards[0].getByText(
        new RegExp(
          `${t("communities:by_creator", { name: firstCreator.name })} • .+ ago`,
        ),
      ),
    ).toBeVisible();
    expect(
      discussionCards[0].getByRole("heading", { name: discussions[0].title }),
    ).toBeVisible();
    expect(
      discussionCards[0].getByText(
        "Hi everyone, I'm looking for fun activities to do here!",
      ),
    ).toBeVisible();
    expect(
      discussionCards[0].getByText(
        t("communities:comments_count", { count: 5 }),
      ),
    ).toBeVisible();

    const secondCreator = await getLiteUser(
      discussions[1].creatorUserId.toString(),
    );
    expect(
      discussionCards[1].getByText(
        new RegExp(
          `${t("communities:by_creator", {
            name: secondCreator.name,
          })} • .+ ago`,
        ),
      ),
    ).toBeVisible();
    expect(
      discussionCards[1].getByRole("heading", { name: discussions[1].title }),
    ).toBeVisible();
    expect(
      discussionCards[1].getByText("Some rules you need to know..."),
    ).toBeVisible();
    expect(
      discussionCards[1].getByText(
        t("communities:comments_count", { count: 0 }),
      ),
    ).toBeVisible();

    expect(listDiscussionsMock).toHaveBeenCalledTimes(1);
    // (communityId, pageToken)
    expect(listDiscussionsMock).toHaveBeenCalledWith(2, undefined);
  });

  it("shows an error alert if the discussions list failed to load", async () => {
    mockConsoleError();
    listDiscussionsMock.mockRejectedValue(
      new Error("Error listing discussions"),
    );
    render(<DiscussionsListPage community={community} />, { wrapper });

    await assertErrorAlert("Error listing discussions");
  });

  describe("Create a new discussion", () => {
    beforeEach(() => {
      createDiscussionMock.mockResolvedValue(discussions[0]);
    });

    it("creates a new discussion successfully and clears the form", async () => {
      render(<DiscussionsListPage community={community} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", {
          name: t("communities:new_post_label"),
        }),
      );
      listDiscussionsMock.mockResolvedValue({
        discussionsList: [
          ...discussions,
          {
            ...discussions[0],
            discussionId: 3,
            title: "Hello world",
            content: "I love the world!",
            thread: {
              threadId: 4,
              numResponses: 0,
            },
            slug: "hello-world",
          },
        ],
        nextPageToken: "",
      });

      await user.type(
        screen.getByLabelText(t("communities:new_discussion_title")),
        "Hello world",
      );
      await user.type(
        screen.getByLabelText(t("communities:new_discussion_topic")),
        "I love the world!",
      );
      await user.click(
        screen.getByRole("button", { name: t("communities:post") }),
      );

      expect(
        (await screen.findByLabelText(
          t("communities:new_discussion_title"),
        )) as HTMLInputElement,
      ).toHaveValue("");
      expect(screen.getAllByTestId(DISCUSSION_CARD_TEST_ID)).toHaveLength(3);
      expect(createDiscussionMock).toHaveBeenCalledTimes(1);
      expect(createDiscussionMock).toHaveBeenCalledWith(
        "Hello world",
        "I love the world!",
        2,
      );
    });

    it("shows an error alert if there is an error creating a new discussion", async () => {
      mockConsoleError();
      createDiscussionMock.mockRejectedValue(
        new Error("Error creating new discussion"),
      );
      render(<DiscussionsListPage community={community} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", {
          name: t("communities:new_post_label"),
        }),
      );
      await user.type(
        screen.getByLabelText(t("communities:new_discussion_title")),
        "Hello world",
      );
      await user.type(
        screen.getByLabelText(t("communities:new_discussion_topic")),
        "I love the world!",
      );
      await user.click(
        screen.getByRole("button", { name: t("communities:post") }),
      );

      await assertErrorAlert("Error creating new discussion");
    });

    it("resets the form if the user presses cancel", async () => {
      render(<DiscussionsListPage community={community} />, { wrapper });

      const user = userEvent.setup();

      await user.click(
        await screen.findByRole("button", {
          name: t("communities:new_post_label"),
        }),
      );
      await user.type(
        screen.getByLabelText(t("communities:new_discussion_title")),
        "Hello world",
      );
      await user.click(
        screen.getByRole("button", { name: t("global:cancel") }),
      );

      expect(
        (await screen.findByLabelText(
          t("communities:new_discussion_title"),
        )) as HTMLInputElement,
      ).toHaveValue("");
    });
  });
});
