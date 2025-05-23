import Alert from "components/Alert";
import { useAuthContext } from "features/auth/AuthProvider";
import CommunityGuidelines from "features/auth/CommunityGuidelines";
import { RpcError } from "grpc-web";
import { useMutation } from "react-query";
import { service } from "service";

export default function CommunityGuidelinesForm() {
  const { authActions, authState } = useAuthContext();

  const mutation = useMutation<void, RpcError, boolean>(
    async (accept) => {
      const state = await service.auth.signupFlowCommunityGuidelines(
        authState.flowState!.flowToken,
        accept,
      );
      authActions.updateSignupState(state);
    },
    {
      onMutate() {
        authActions.clearError();
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    },
  );

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      <CommunityGuidelines
        onSubmit={(accept) => mutation.mutateAsync(accept)}
      />
    </>
  );
}
