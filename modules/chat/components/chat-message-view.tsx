"use client";
import React, { useState } from "react";
import ChatWelcomeTabs from "./chat-welcome-tabs";
import ChatMessageForm from "./chat-message-form";

import { User } from "@prisma/client";

interface ChatMessageViewProps {
  user: User | null;
}

const ChatMessageView = ({ user }: ChatMessageViewProps) => {

    const [selectedMessage, setSelectedMessage] = useState("")

    const handleMessageSelect = (messsage: string) => {
        setSelectedMessage(messsage)
    }

    const handleMessageChange = () => {
        setSelectedMessage("")
    }


    return (
        <div className="flex flex-col items-center justify-center h-full space-y-10">
            <ChatWelcomeTabs
                userName={user?.name}
                onMessageSelect={handleMessageSelect}
            />
            <ChatMessageForm
                initialMessage={selectedMessage}
                onMessageChange={handleMessageChange}
            />
        </div>
    )
}

export default ChatMessageView