import { create } from "zustand";

interface ChatStore {
  chats: any[];
  activeChatId: string | null;
  messages: any[];
  triggeredChats: Set<string>;

  setChats: (chats: any[]) => void;
  setActiveChatId: (chatId: string | null) => void;
  setMessages: (messages: any[]) => void;
  addChat: (chat: any) => void;
  addMessage: (message: any) => void;
  clearMessages: () => void;
  markChatAsTriggered: (chatId: string) => void;
  hasChatBeenTriggered: (chatId: string) => boolean;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  triggeredChats: new Set<string>(),

  setChats: (chats) => set({ chats }),
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  setMessages: (messages) => set({ messages }),

  addChat: (chat) => set({ chats: [chat, ...get().chats] }),


  addMessage: (message) => set({ messages: [...get().messages, message] }),

  clearMessages: () => set({ messages: [] }),

  markChatAsTriggered: (chatId) => {
    const triggered = new Set(get().triggeredChats);
    triggered.add(chatId);
    set({ triggeredChats: triggered });
  },

  hasChatBeenTriggered: (chatId) => {
    return get().triggeredChats.has(chatId);
  },
}));