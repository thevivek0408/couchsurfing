import Button from "@/components/Button";
import Snackbar from "@/components/Snackbar";
import getAllPages from "@/utils/getAllPages";
import { groupChatsListKey, hostRequestsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";


export default function MarkAllReadButton({
  type,
}: {
  type: "chats" | "hosting" | "surfing";
}) {
  const { t } = useTranslation(MESSAGES);
  const queryClient = useQueryClient();
  const markAll = useMutation<void, RpcError>(
    async () => {
      if (type === "chats") {
        const data = await getAllPages({
          serviceFunction: service.conversations.listGroupChats,
          listKey: "groupChatsList",
          params: (previousData) => previousData?.lastMessageId,
          hasMore: (previousData) => !previousData.noMore,
        });
        await Promise.all(
          data.map<void>((chat) =>
            chat.latestMessage &&
            chat.lastSeenMessageId < chat.latestMessage.messageId
              ? service.conversations.markLastSeenGroupChat(
                  chat.groupChatId,
                  chat.latestMessage.messageId
                )
              : Promise.resolve()
          )
        );
      } else {
        const data = await getAllPages({
          serviceFunction: service.requests.listHostRequests,
          listKey: "hostRequestsList",
          params: (previousData) => ({
            lastRequestId: previousData?.lastRequestId,
            type,
          }),
          hasMore: (previousData) => !previousData.noMore,
        });
        await Promise.all(
          data.map<void>((request) =>
            request.latestMessage &&
            request.lastSeenMessageId < request.latestMessage.messageId
              ? service.requests.markLastRequestSeen(
                  request.hostRequestId,
                  request.latestMessage.messageId
                )
              : Promise.resolve()
          )
        );
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(hostRequestsListKey());
        queryClient.invalidateQueries(groupChatsListKey);
      },
    }
  );

  return (
    <>
      {markAll.error && (
        <Snackbar severity="error">{markAll.error.message}</Snackbar>
      )}

      <Button
        loading={markAll.isLoading}
        onPress={() => markAll.mutate()}
        title={t("mark_all_read_button_text")}
      />
    </>
  );
}
