"use client";

import { useChat } from "@ai-sdk/react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";

import { Spinner } from "@/components/ui/spinner";
import { RotateCcwIcon, StopCircleIcon } from "lucide-react";

import { ModelSelector } from "@/modules/chat/components/model-selector";
import { useAIModels } from "@/modules/ai-agent/hook/ai-agent";
import { useChatStore } from "@/modules/chat/store/chat-store";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  chatId: string;
  chatData: any;
};

const ChatWithMessages = ({ chatId, chatData }: Props) => {
  const { data: models, isPending: isModelLoading } = useAIModels();

  const { hasChatBeenTriggered, markChatAsTriggered } = useChatStore();

  const [selectedModel, setSelectedModel] = useState(chatData.model);

  const [input, setInput] = useState("");

  const router = useRouter();

  const searchParams = useSearchParams();

  const hasAutoTriggered = useRef(false);

  const shouldAutoTrigger =
    searchParams.get("autoTrigger") === "true";

  const initialMessages = useMemo(() => {
    if (!chatData.messages) return [];

    return chatData.messages
      .filter(
        (msg: any) =>
          msg.id &&
          msg.content &&
          msg.content.trim() !== ""
      )
      .map((msg: any) => {
        try {
          const parts = JSON.parse(msg.content);

          return {
            id: msg.id,
            role: msg.messageRole.toLowerCase(),
            parts: Array.isArray(parts)
              ? parts
              : [
                {
                  type: "text",
                  text: msg.content,
                },
              ],
            createdAt: msg.createdAt,
          };
        } catch {
          return {
            id: msg.id,
            role: msg.messageRole.toLowerCase(),
            parts: [
              {
                type: "text",
                text: msg.content,
              },
            ],
            createdAt: msg.createdAt,
          };
        }
      });
  }, [chatData]);

  const {
    messages,
    sendMessage,
    stop,
    regenerate,
    status,
  } = useChat({
    messages: initialMessages,
  });


  useEffect(() => {
    setSelectedModel(chatData.model);
  }, [chatData.model]);

  useEffect(() => {
    if (hasAutoTriggered.current) return;

    if (!selectedModel) return;

    if (hasChatBeenTriggered(chatId)) return;

    if (initialMessages.length === 0) return;

    const lastMessage =
      initialMessages[initialMessages.length - 1];

    if (lastMessage.role !== "user") return;

    hasAutoTriggered.current = true;

    markChatAsTriggered(chatId);

    regenerate({
      body: {
        chatId,
        model: selectedModel,
        skipUserMessage: true,
      },
    });

    if (shouldAutoTrigger) {
      router.replace(`/chat/${chatId}`, {
        scroll: false,
      });
    }
  }, [
    shouldAutoTrigger,
    chatId,
    selectedModel,
    initialMessages,
    hasChatBeenTriggered,
    markChatAsTriggered,
    regenerate,
    router,
  ]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    sendMessage(
      {
        text: input,
      },
      {
        body: {
          chatId,
          model: selectedModel,
        },
      }
    );

    setInput("");
  };

  const handleRetry = () => {
    regenerate();
  };

  const handleStop = () => {
    stop();
  };

  const messageToRender =
    messages.length > 0 ? messages : initialMessages;

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messageToRender.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                Start a conversation...
              </div>
            ) : (
              messageToRender.map((message: any) => (
                <Fragment key={message.id}>
                  {message.parts.map((part: any, i: number) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Message from={message.role} key={`${message.id}-${i}`}>
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                          </Message>
                        );

                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="max-w-2xl px-4 py-4 border border-muted rounded-md bg-muted/50"
                          >
                            <ReasoningTrigger />
                            <ReasoningContent className="mt-2 italic font-light text-muted-foreground">
                              {part.text}
                            </ReasoningContent>
                          </Reasoning>
                        );

                      default:
                        return null;
                    }
                  })}
                </Fragment>
              ))
            )}

            {status === "streaming" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner />

                <span className="text-sm">
                  AI is thinking...
                </span>
              </div>
            )}
          </ConversationContent>

          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools className="flex items-center gap-2">
              {isModelLoading ? (
                <Spinner />
              ) : (
                <ModelSelector
                  models={models?.models}
                  selectedModelId={selectedModel}
                  onModelSelect={setSelectedModel}
                />
              )}

              {status === "streaming" ? (
                <PromptInputButton onClick={handleStop}>
                  <StopCircleIcon size={16} />
                  <span>Stop</span>
                </PromptInputButton>
              ) : (
                messages.length > 0 && (
                  <PromptInputButton onClick={handleRetry}>
                    <RotateCcwIcon size={16} />
                    <span>Retry</span>
                  </PromptInputButton>
                )
              )}
            </PromptInputTools>

            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatWithMessages;