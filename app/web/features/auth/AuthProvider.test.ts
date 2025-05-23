import { act, renderHook } from "@testing-library/react";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { service } from "service";
import i18n from "test/i18n";

import * as client from "../../service/client";
import wrapper from "../../test/hookWrapper";
import { addDefaultUser } from "../../test/utils";
import { useAuthContext } from "./AuthProvider";
import { JAILED_ERROR_MESSAGE, LOGGED_OUT_ERROR_MESSAGE } from "./constants";

const { t } = i18n;

jest.mock("../../service/client");

const logoutMock = service.user.logout as jest.Mock;
const getIsJailedMock = service.jail.getIsJailed as jest.Mock;

describe("AuthProvider", () => {
  it("sets an unauthenticatedErrorHandler function that logs out correctly", async () => {
    logoutMock.mockResolvedValue(new Empty());
    addDefaultUser();

    //mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: (e: RpcError) => Promise<void> = initialHandler;
    const mockSetHandler = jest.fn((fn: (e: RpcError) => Promise<void>) => {
      handler = fn;
    });
    jest
      .spyOn(client, "setUnauthenticatedErrorHandler")
      .mockImplementation(mockSetHandler);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(mockSetHandler).toBeCalled();
    await act(async () => {
      await handler({ message: LOGGED_OUT_ERROR_MESSAGE } as RpcError);
    });
    expect(result.current.authState.authenticated).toBe(false);
    expect(result.current.authState.error).toBe(t("auth:logged_out_message"));
  });

  it("sets an unauthenticatedErrorHandler function that redirects to jail if jailed correctly", async () => {
    getIsJailedMock.mockResolvedValue({ isJailed: true });
    addDefaultUser();

    //mock out setUnauthenticatedErrorHandler to set our own handler var
    const initialHandler = async () => {};
    let handler: (e: RpcError) => Promise<void> = initialHandler;
    const mockSetHandler = jest.fn((fn: (e: RpcError) => Promise<void>) => {
      handler = fn;
    });
    jest
      .spyOn(client, "setUnauthenticatedErrorHandler")
      .mockImplementation(mockSetHandler);

    const { result } = renderHook(() => useAuthContext(), {
      wrapper,
    });

    expect(mockSetHandler).toBeCalled();
    await act(async () => {
      await handler({ message: JAILED_ERROR_MESSAGE } as RpcError);
    });
    expect(result.current.authState.authenticated).toBe(true);
    expect(result.current.authState.jailed).toBe(true);
  });
});
