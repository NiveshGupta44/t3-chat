"use client";
import React from "react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";
import { useChatStore } from "@/modules/chat/store/chat-store";

const Header = () => {
    const { toggleSidebar } = useChatStore();

    return (
        <div className="flex h-14 w-full flex-row justify-between items-center border-b border-border bg-sidebar px-4 py-2 z-30">
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                title="Toggle sidebar"
                className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
            >
                <MenuIcon className="h-5 w-5" />
            </Button>
            <ModeToggle />
        </div>
    )
}

export default Header