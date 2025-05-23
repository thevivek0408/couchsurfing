import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QUESTIONS_OPTIONAL } from "components/ContributorForm/constants";
import { EditLocationMapProps } from "components/EditLocationMap";
import useAuthStore from "features/auth/useAuthStore";
import { hostingStatusLabels } from "features/profile/constants";
import { StatusCode } from "grpc-web";
import mockRouter from "next-router-mock";
import { HostingStatus } from "proto/api_pb";
import { SignupFlowRes } from "proto/auth_pb";
import TagManager from "react-gtm-module";
import { dashboardRoute, signupRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import Signup from "./Signup";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
  };
});

const startSignupMock = service.auth.startSignup as MockedService<
  typeof service.auth.startSignup
>;
const signupFlowAccountMock = service.auth.signupFlowAccount as MockedService<
  typeof service.auth.signupFlowAccount
>;
const getCommunityGuidelinesMock = service.resources
  .getCommunityGuidelines as MockedService<
  typeof service.resources.getCommunityGuidelines
>;
const signupFlowCommunityGuidelinesMock = service.auth
  .signupFlowCommunityGuidelines as MockedService<
  typeof service.auth.signupFlowCommunityGuidelines
>;
const signupFlowFeedbackMock = service.auth.signupFlowFeedback as MockedService<
  typeof service.auth.signupFlowFeedback
>;
const signupFlowEmailTokenMock = service.auth
  .signupFlowEmailToken as MockedService<
  typeof service.auth.signupFlowEmailToken
>;
const validateUsernameMock = service.auth.validateUsername as MockedService<
  typeof service.auth.validateUsername
>;

const View = () => {
  return <Signup />;
};

jest.mock("components/EditLocationMap", () => ({
  __esModule: true,
  default: (props: EditLocationMapProps) => (
    <input
      data-testid="edit-location-map"
      onChange={(event) => {
        props.updateLocation({
          lat: 1,
          lng: 2,
          address: event.target.value,
          radius: 5,
        });
      }}
    />
  ),
}));

describe("Signup", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl(signupRoute);
    getCommunityGuidelinesMock.mockResolvedValue({
      communityGuidelinesList: [
        {
          title: "Guideline 1",
          guideline: "Follow guideline 1",
          iconSvg: "<svg></svg>",
        },
        {
          title: "Guideline 2",
          guideline: "Follow guideline 2",
          iconSvg: "<svg></svg>",
        },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.localStorage.clear();
  });

  describe("flow steps", () => {
    it("basic -> account form works", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: true,
          needAccount: true,
          needAcceptCommunityGuidelines: true,
          needFeedback: true,
          needVerifyEmail: false,
        }),
      );
      startSignupMock.mockResolvedValue({
        flowToken: "token",
        needBasic: false,
        needAccount: true,
        needAcceptCommunityGuidelines: true,
        needFeedback: true,
        needVerifyEmail: false,
      });

      render(<View />, { wrapper });

      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(t("auth:basic_form.name.field_label")),
        "Test user",
      );
      await user.type(
        screen.getByLabelText(t("auth:basic_form.email.field_label")),
        "test@example.com{enter}",
      );
      expect(
        await screen.findByLabelText(
          t("auth:account_form.username.field_label"),
        ),
      ).toBeVisible();
    });

    it("account -> guidelines form works", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: true,
          needAcceptCommunityGuidelines: true,
          needFeedback: true,
          needVerifyEmail: false,
        }),
      );
      signupFlowAccountMock.mockResolvedValue({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: true,
        needFeedback: true,
        needVerifyEmail: false,
      });
      validateUsernameMock.mockResolvedValue(true);

      render(<View />, { wrapper });

      const user = userEvent.setup();

      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.username.field_label"),
        ),
        "test",
      );
      await user.type(
        await screen.findByLabelText(
          t("auth:account_form.password.field_label"),
        ),
        "a very insecure password",
      );
      const birthdayField = screen.getByLabelText(
        t("auth:account_form.birthday.field_label"),
      );
      await user.clear(birthdayField);
      await user.type(birthdayField, "01/01/1990");

      await user.type(
        screen.getByTestId("edit-location-map"),
        "test city, test country",
      );

      await user.selectOptions(
        screen.getByLabelText(
          t("auth:account_form.hosting_status.field_label"),
        ),
        hostingStatusLabels(t)[HostingStatus.HOSTING_STATUS_CAN_HOST],
      );

      await user.click(
        screen.getByLabelText(t("auth:account_form.gender.woman")),
      );
      await user.click(
        await screen.findByLabelText(t("auth:account_form.tos_accept_label")),
      );

      await user.click(
        screen.getByRole("button", { name: t("global:sign_up") }),
      );

      expect(await screen.findByText("Guideline 1")).toBeVisible();
    });

    it.only("guidelines -> contributor form works", async () => {
      window.localStorage.setItem(
        "auth.flowState",
        JSON.stringify({
          flowToken: "token",
          needBasic: false,
          needAccount: false,
          needAcceptCommunityGuidelines: true,
          needFeedback: true,
          needVerifyEmail: false,
        }),
      );
      signupFlowCommunityGuidelinesMock.mockResolvedValue({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: false,
        needFeedback: true,
        needVerifyEmail: false,
      });
      render(<View />, { wrapper });

      const user = userEvent.setup({});

      const checkboxes = await screen.findAllByLabelText(
        t("auth:community_guidelines_form.guideline.checkbox_label"),
      );
      checkboxes.forEach(async (checkbox) => await user.click(checkbox));
      const button = await screen.findByRole("button", {
        name: t("global:continue"),
      });

      await waitFor(() => expect(button).not.toBeDisabled());

      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
      });
    });
  });

  it("contributor form -> success", async () => {
    jest.spyOn(console, "warn").mockImplementation(undefined);
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: false,
        needFeedback: true,
        needVerifyEmail: false,
      }),
    );
    signupFlowFeedbackMock.mockResolvedValue({
      flowToken: "token",
      authRes: { userId: 1, jailed: false },
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
    });

    render(<View />, { wrapper });

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    await waitFor(() => expect(mockRouter.pathname).toBe(dashboardRoute));

    expect(TagManager.dataLayer).toHaveBeenCalledTimes(1);
    expect(TagManager.dataLayer).toHaveBeenCalledWith({
      dataLayer: {
        event: "sign_up",
        signupMethod: "email",
        userId: expect.any(String),
        "gtm.elementUrl": expect.any(String),
      },
    });
  });

  it("displays the basic form if it is needed", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: true,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(
      screen.getByLabelText(t("auth:basic_form.email.field_label")),
    ).toBeVisible();
  });

  it("displays the account form when account, feedback, guidelines and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needFeedback: true,
      needAcceptCommunityGuidelines: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(
      screen.getByLabelText(t("auth:account_form.username.field_label")),
    ).toBeVisible();
  });

  it("displays the account form when account, guidelines and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: false,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(
      screen.getByLabelText(t("auth:account_form.username.field_label")),
    ).toBeVisible();
  });

  it("displays the account form when only account is pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(
      screen.getByLabelText(t("auth:account_form.username.field_label")),
    ).toBeVisible();
  });

  it("displays the guidelines form when guidelines, feedback and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(await screen.findByText("Guideline 1")).toBeVisible();
  });

  it("displays the guidelines form when only it and feedback are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(await screen.findByText("Guideline 1")).toBeVisible();
  });

  it("displays the feedback form when feedback and email are pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
  });

  it("displays the feedback form when only feedback is pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: true,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(screen.getByText(QUESTIONS_OPTIONAL)).toBeVisible();
  });

  it("displays the verify email message when email is pending", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(screen.getByText(t("auth:sign_up_completed_prompt"))).toBeVisible();
  });

  it("displays the redirect message when nothing is pending and has authRes", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
      flowToken: "token",
      authRes: { userId: 1, jailed: false },
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    render(<View />, { wrapper });
    expect(
      await screen.findByText(t("auth:sign_up_confirmed_prompt")),
    ).toBeVisible();
  });

  it("throws an error if nothing is pending but there is no authres", async () => {
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: false,
      needAcceptCommunityGuidelines: false,
      needFeedback: false,
      needVerifyEmail: false,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    mockConsoleError();
    await expect(async () => render(<View />, { wrapper })).rejects.toThrow();
  });

  it("displays an error when present", async () => {
    const signupFlowFeedbackMock = service.auth
      .signupFlowFeedback as MockedService<
      typeof service.auth.signupFlowFeedback
    >;
    signupFlowFeedbackMock.mockRejectedValue({
      code: StatusCode.PERMISSION_DENIED,
      message: "Permission denied",
    });
    window.localStorage.setItem(
      "auth.flowState",
      JSON.stringify({
        flowToken: "token",
        needBasic: false,
        needAccount: false,
        needAcceptCommunityGuidelines: false,
        needFeedback: true,
        needVerifyEmail: false,
      }),
    );
    render(<View />, { wrapper });

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: t("global:submit") }),
    );
    mockConsoleError();
    await assertErrorAlert("Permission denied");
  });

  it("sets the email flow state correctly when given a url token", async () => {
    signupFlowEmailTokenMock.mockResolvedValue({
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: false,
      flowToken: "token",
    });
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));

    mockRouter.setCurrentUrl(`${signupRoute}?token=fakeEmailToken`);
    render(<View />, {
      wrapper,
    });
    expect(
      await screen.findByLabelText(t("auth:account_form.username.field_label")),
    ).toBeVisible();
    expect(signupFlowEmailTokenMock).toBeCalledWith("fakeEmailToken");
    const { result } = renderHook(() => useAuthStore(), { wrapper });
    expect(result.current.authState.flowState?.needVerifyEmail).toBe(false);
  });

  it("displays an error when email token api errors", async () => {
    signupFlowEmailTokenMock.mockRejectedValue({
      code: StatusCode.NOT_FOUND,
      message: "Invalid token",
    });
    const state: SignupFlowRes.AsObject = {
      needBasic: false,
      needAccount: true,
      needAcceptCommunityGuidelines: true,
      needFeedback: true,
      needVerifyEmail: true,
      flowToken: "token",
    };
    window.localStorage.setItem("auth.flowState", JSON.stringify(state));
    mockRouter.setCurrentUrl(`${signupRoute}?token=fakeEmailToken`);
    render(<View />, {
      wrapper,
    });
    await assertErrorAlert("Invalid token");
  });
});
