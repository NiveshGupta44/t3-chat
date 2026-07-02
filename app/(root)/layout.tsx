import Header from "@/components/header";
import { currentUser } from "@/modules/authentication/actions";
import ChatSidebar from "@/modules/chat/components/chat-sidebar";
import React from "react";
import { getAllChats } from "@/modules/chat/actions";

const Layout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = await currentUser();

  const result = await getAllChats();

  const chats = result.success ? result.data ?? [] : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar user={session} chats={chats} />
      <main className="flex-1 overflow-hidden">
        <Header />
        {children}
      </main>
    </div>
  );
};

export default Layout;