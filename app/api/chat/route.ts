import { convertToModelMessages, streamText, createIdGenerator, type UIMessage } from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompt";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

const provider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function convertStoredMessageToUI(msg: any) {
  try {
    const parts = JSON.parse(msg.content);
    const validParts = parts.filter((part) => part.type === "text");

    if (validParts.length === 0) return null;

    return {
      id: msg.id,
      role: msg.messageRole.toLowerCase(),
      parts: validParts,
      createdAt: msg.createdAt,
    };
  } catch (e) {
    return {
      id: msg.id,
      role: msg.messageRole.toLowerCase(),
      parts: [{ type: "text", text: msg.content }],
      createdAt: msg.createdAt,
    };
  }
}

function extractPartsAsJSON(message) {
  if (message.parts && Array.isArray(message.parts)) {
    return JSON.stringify(message.parts);
  }

  const content = message.content || "";
  return JSON.stringify([{ type: "text", text: content }]);
}

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("Incoming body:", JSON.stringify(body, null, 2));

    const {
      chatId,
      messages: newMessages,
      model,
      skipUserMessage,
    } = body;

    // rest of your code...

    const previousMessages = chatId
      ? await db.message.findMany({
        where: { chatId },
        orderBy: {
          createdAt: "asc",
        },
      })
      : [];

    const uiMessages = previousMessages
      .map(convertStoredMessageToUI)
      .filter((msg) => msg !== null);

    const normalizedNewMessages = Array.isArray(newMessages)
      ? newMessages
      : newMessages
        ? [newMessages]
        : [];

    const allUIMessages = [...uiMessages, ...normalizedNewMessages].filter(Boolean);

    let modelMessages;

    try {
      modelMessages = await convertToModelMessages(allUIMessages);
    } catch (conversionError) {
      modelMessages = allUIMessages
        .map((msg) => ({
          role: msg.role,
          content: msg.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("\n"),
        }))
        .filter((m) => m.content);
    }

    console.log("UI Messages:", allUIMessages);
    console.log("Model Messages:", modelMessages);
    const result = streamText({
      model: provider.chat(model),
      messages: modelMessages,
      system: CHAT_SYSTEM_PROMPT,
    });

    result.consumeStream();
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      originalMessages: allUIMessages,
      onFinish: async ({ responseMessage }) => {

        try {
          const messagesToSave = [];

          if (!skipUserMessage) {
            const latestUserMessage =
              normalizedNewMessages[normalizedNewMessages.length - 1];

            if (latestUserMessage?.role === "user") {
              const userPartsJSON = extractPartsAsJSON(latestUserMessage);

              messagesToSave.push({
                chatId,
                content: userPartsJSON,
                messageRole: MessageRole.USER,
                model,
                messageType: MessageType.NORMAL,
              });
            }
          }

          const hasRealContent = responseMessage?.parts?.some(
            (p) => p.type === "text" || p.type === "reasoning"
          );

          if (hasRealContent) {
            const assistantPartsJSON = extractPartsAsJSON(responseMessage);

            messagesToSave.push({
              chatId,
              content: assistantPartsJSON,
              messageRole: MessageRole.ASSISTANT,
              model,
              messageType: MessageType.NORMAL,
            });
          }

          if (messagesToSave.length > 0) {
            await db.message.createMany({
              data: messagesToSave,
            });
          }
        } catch (error) {
          console.error("❌ Error saving messages:", error);
        }
      },
    });
  } catch (error) {
    console.error("❌ API Route Error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Internal server error",
        details: (error as Error).toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}