import Button from "components/Button";
import { PersonAddIcon } from "components/Icons";
import { userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { CONNECTIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { User } from "proto/api_pb";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

import { SetMutationError } from ".";

interface AddFriendButtonProps {
  setMutationError: SetMutationError;
  userId: number;
}

export default function AddFriendButton({
  setMutationError,
  userId,
}: AddFriendButtonProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation([CONNECTIONS]);
  const { isLoading, mutate: sendFriendRequest } = useMutation<
    Empty,
    Error,
    AddFriendButtonProps
  >(({ userId }) => service.api.sendFriendRequest(userId), {
    onMutate: async ({ setMutationError }) => {
      setMutationError("");

      await queryClient.cancelQueries(userKey(userId));

      const cachedUser = queryClient.getQueryData<User.AsObject>(
        userKey(userId),
      );

      if (cachedUser) {
        queryClient.setQueryData<User.AsObject>(userKey(userId), {
          ...cachedUser,
          friends: User.FriendshipStatus.PENDING,
        });
      }
      return cachedUser;
    },

    onError: (error, { setMutationError }, cachedUser) => {
      setMutationError(error.message);
      if (cachedUser) {
        queryClient.setQueryData(userKey(userId), cachedUser);
      }
    },

    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries(userKey(userId));
    },
  });

  return (
    <Button
      startIcon={<PersonAddIcon />}
      onClick={() => {
        sendFriendRequest({ setMutationError, userId });
      }}
      loading={isLoading}
    >
      {t("connections:add_friend")}
    </Button>
  );
}
