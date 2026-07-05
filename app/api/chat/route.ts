import { convertToModelMessages, streamText, createIdGenerator, type UIMessage } from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompt";
import db from "@/lib/db";
import { Message, MessageRole, MessageType } from "@prisma/client";
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

const provider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function convertStoredMessageToUI(msg: Message) {
  try {
    const parts = JSON.parse(msg.content);
    const validParts = parts.filter((part: any) => part.type === "text");

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

function extractPartsAsJSON(message: any) {
  if (message.parts && Array.isArray(message.parts)) {
    return JSON.stringify(message.parts);
  }

  const content = message.content || "";
  return JSON.stringify([{ type: "text", text: content }]);
}

export async function POST(req: Request) {
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
      .filter((msg: any) => msg !== null);

    const normalizedNewMessages = Array.isArray(newMessages)
      ? newMessages
      : newMessages
        ? [newMessages]
        : [];

    // Deduplicate: only add client messages that aren't already in DB (using robust string comparison)
    const newOnly = normalizedNewMessages.filter(
      (newMsg: any) => !uiMessages.some((oldMsg: any) => String(oldMsg.id) === String(newMsg.id))
    );
    const allUIMessages = [...uiMessages, ...newOnly].filter(Boolean);

    let modelMessages;

    try {
      modelMessages = await convertToModelMessages(allUIMessages);
    } catch (conversionError) {
      modelMessages = allUIMessages
        .map((msg: any) => ({
          role: msg.role,
          content: msg.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("\n"),
        }))
        .filter((m: any) => m.content);
    }

    console.log("UI Messages:", allUIMessages);
    console.log("Model Messages:", modelMessages);

    let result;
    try {
      result = streamText({
        model: provider.chat(model),
        messages: modelMessages,
        system: CHAT_SYSTEM_PROMPT,
      });
    } catch (streamError: any) {
      console.error("❌ Stream creation error:", streamError);
      const statusCode = streamError?.statusCode || streamError?.status || 500;
      const isRateLimit = statusCode === 429;
      return new Response(
        JSON.stringify({
          error: isRateLimit
            ? "This model is currently rate-limited. Please try again in a few moments or select a different model."
            : streamError?.message || "Failed to get AI response",
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    result.consumeStream();
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      originalMessages: allUIMessages,
      onFinish: async ({ responseMessage }) => {

        try {
          const messagesToSave = [];
          const latestUserMessage =
            normalizedNewMessages[normalizedNewMessages.length - 1];

          const isUserMessageAlreadySaved = latestUserMessage?.id
            ? previousMessages.some((m: any) => String(m.id) === String(latestUserMessage.id))
            : false;

          if (!skipUserMessage && !isUserMessageAlreadySaved) {
            if (latestUserMessage?.role === "user" && latestUserMessage?.id) {
              const userPartsJSON = extractPartsAsJSON(latestUserMessage);

              messagesToSave.push({
                id: latestUserMessage.id,
                chatId,
                content: userPartsJSON,
                messageRole: MessageRole.USER,
                model,
                messageType: MessageType.NORMAL,
              });
            }
          }

          const hasRealContent = responseMessage?.parts?.some(
            (p: any) => p.type === "text" || p.type === "reasoning"
          );

          if (hasRealContent) {
            const assistantPartsJSON = extractPartsAsJSON(responseMessage);

            messagesToSave.push({
              id: responseMessage.id,
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