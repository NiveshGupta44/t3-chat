import { requireAuth } from "@/modules/authentication/actions";
import React from "react";
import { getAllChats } from "@/modules/chat/actions";
import SidebarLayoutWrapper from "@/components/sidebar-layout-wrapper";

const Layout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = await requireAuth();

  const result = await getAllChats();

  const chats = result.success ? result.data ?? [] : [];

  return (
    <SidebarLayoutWrapper user={session} chats={chats}>
      {children}
    </SidebarLayoutWrapper>
  );
};

export default Layout;