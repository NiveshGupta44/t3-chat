"use client";

import { Spinner } from "@/components/ui/spinner";
import { useGetChatById } from "@/modules/chat/hooks/chat";
import ChatWithMessages from "./chat-with-messages";

const MessageWithForm = ({ chatId }: { chatId: string }) => {
  const { data, isPending } = useGetChatById(chatId);
  console.log("Chat Data:", data);
  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chat not found.
      </div>
    );
  }

  return (
    <ChatWithMessages
      key={chatId}
      chatId={chatId}
      chatData={data.data}
    />
  );
};

export default MessageWithForm;