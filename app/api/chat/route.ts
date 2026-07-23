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
    const parsed = JSON.parse(msg.content);
    if (Array.isArray(parsed)) {
      const validParts = parsed.filter(
        (part: any) => part && (part.type === "text" || part.type === "reasoning")
      );
      if (validParts.length > 0) {
        return {
          id: msg.id,
          role: msg.messageRole.toLowerCase(),
          parts: validParts,
          createdAt: msg.createdAt,
        };
      }
    }
  } catch (e) {
    // Fallback for non-JSON string content
  }

  return {
    id: msg.id,
    role: msg.messageRole.toLowerCase(),
    parts: [{ type: "text", text: msg.content || "" }],
    createdAt: msg.createdAt,
  };
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
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY.trim() === "" || process.env.OPENROUTER_API_KEY.includes("your_openrouter_api_key")) {
      return new Response(
        JSON.stringify({
          error: "OPENROUTER_API_KEY is missing or using placeholder in .env.local. Please set a valid OpenRouter API key.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();

    console.log("Incoming body:", JSON.stringify(body, null, 2));

    const {
      chatId,
      messages: newMessages,
      model,
      skipUserMessage,
    } = body;

    const targetModel = model || "google/gemini-2.0-flash-lite-001";

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

    // Deduplicate stored DB messages and incoming client messages by ID
    const messageMap = new Map<string, any>();
    for (const msg of uiMessages) {
      if (msg && msg.id) {
        messageMap.set(msg.id, msg);
      }
    }
    for (const msg of normalizedNewMessages) {
      if (msg && msg.id) {
        messageMap.set(msg.id, msg);
      }
    }

    const sanitizedUIMessages = Array.from(messageMap.values()).map((msg: any) => {
      let parts = msg.parts;
      if (!Array.isArray(parts) || parts.length === 0) {
        const textContent = typeof msg.content === "string" ? msg.content : (msg.text || "");
        parts = [{ type: "text", text: textContent }];
      }

      const role = String(msg.role || "user").toLowerCase();
      const validRole = (role === "system" || role === "assistant") ? role : "user";

      return {
        id: String(msg.id || Date.now()),
        role: validRole as "user" | "system" | "assistant",
        parts,
      };
    });

    let modelMessages;

    try {
      modelMessages = await convertToModelMessages(sanitizedUIMessages);
    } catch (conversionError) {
      console.warn("convertToModelMessages failed, using manual fallback:", conversionError);
      modelMessages = sanitizedUIMessages
        .map((msg: any) => ({
          role: msg.role,
          content: msg.parts
            .filter((p: any) => p && p.type === "text")
            .map((p: any) => p.text)
            .join("\n"),
        }))
        .filter((m: any) => m.content);
    }

    console.log("UI Messages:", sanitizedUIMessages);
    console.log("Model Messages:", modelMessages);
    const result = streamText({
      model: provider.chat(targetModel),
      messages: modelMessages,
      system: CHAT_SYSTEM_PROMPT,
    });

    result.consumeStream();
    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      originalMessages: sanitizedUIMessages,
      onFinish: async ({ responseMessage }) => {

        try {
          const messagesToSave = [];

          if (!skipUserMessage && normalizedNewMessages.length > 0) {
            const latestUserMessage =
              normalizedNewMessages[normalizedNewMessages.length - 1];

            if (latestUserMessage?.role === "user") {
              const isAlreadyInDB = previousMessages.some(
                (pm: Message) => pm.id === latestUserMessage.id
              );

              if (!isAlreadyInDB) {
                const userPartsJSON = extractPartsAsJSON(latestUserMessage);

                messagesToSave.push({
                  chatId,
                  content: userPartsJSON,
                  messageRole: MessageRole.USER,
                  model: targetModel,
                  messageType: MessageType.NORMAL,
                });
              }
            }
          }

          if (responseMessage) {
            const hasRealContent =
              responseMessage?.parts?.some(
                (p: any) => (p.type === "text" || p.type === "reasoning") && p.text
              ) ||
              (typeof (responseMessage as any)?.content === "string" && (responseMessage as any).content.trim() !== "");

            if (hasRealContent) {
              const assistantPartsJSON = extractPartsAsJSON(responseMessage);

              messagesToSave.push({
                chatId,
                content: assistantPartsJSON,
                messageRole: MessageRole.ASSISTANT,
                model: targetModel,
                messageType: MessageType.NORMAL,
              });
            }
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