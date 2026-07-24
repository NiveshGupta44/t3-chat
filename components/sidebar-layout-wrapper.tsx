"use client";
import React, { useEffect } from "react";
import ChatSidebar from "@/modules/chat/components/chat-sidebar";
import Header from "@/components/header";
import { useChatStore } from "@/modules/chat/store/chat-store";
import { cn } from "@/lib/utils";

export default function SidebarLayoutWrapper({
  user,
  chats,
  children,
}: {
  user: any;
  chats: any[];
  children: React.ReactNode;
}) {
  const { sidebarOpen, setSidebarOpen } = useChatStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ChatSidebar user={user} chats={chats} />
      
      {/* Overlay backdrop for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
