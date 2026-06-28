import  MessageWithForm  from "@/modules/chat/components/messages/message-view-form";
import React from "react";

const ChatIdPage=  async({params}: {params:Promise<{chatId:string}>})=>{
    const {chatId} = await params;
    return (
        <MessageWithForm chatId={chatId} />
    )
}

export default ChatIdPage