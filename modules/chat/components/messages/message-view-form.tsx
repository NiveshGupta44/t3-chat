"use client";

import React, { useEffect, useMemo , useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAIModels } from "@/modules/ai-agent/hook/ai-agent";
import { useGetChatById } from "../../hooks/chat";
import { Spinner } from "@/components/ui/spinner";

function parseMessageToUI(msg){
    const basePart = { typr: "text", text: msg.content};
    try {
        const parts = JSON.parse(msg.content);
        return {
            id: msg.id,
            role: msg.messageRole.toLowerCase(),
            parts: Array.isArray(parts) ? parts : [basePart],
            createdAt: msg.createdAt,
        };
    } catch {
        return{
            id:msg.id,
            role:msg.messageRole.toLowerCase(),
            parts: [basePart],
            createdAt: msg.createdAt,
        };
    }
}

export const MessageViewWithForm = ({ chatId}:String) =>{
    const router = useRouter();
    const searchParams = useSearchParams();
    const shouldAutoTrigger = searchParams.get("autoTrigger") === "true";
    const hasAutoTrigger = useRef(false);

    const [selectedModel, setSelectedModel] = useState(null);
    const [input, setInput] = useState("");
    const {data:models, isPending: isModelLoading }= useAIModels();
    const {data, isPending} = useGetChatById(chatId);

    const initialMessages = useMemo(()=>{
        if(!data?.data?.messages) return[];
        return data.data.messages
        .filter((msg) =>msg.content?.trim() && msg.id)
        .map(parseMessageToUI)
    },[data])

    useEffect(()=>{
        if(data?.data?.model && !selectedModel){
            setSelectedModel(data.data.model)
        }

    },[data,selectedModel])

    if(isPending){
        return(
            <div className="flex items-center justify-center h-full">
                <Spinner />
            </div>
        )
    }
    return (

    <div className="max-w-4xl mx-auto p-6 relative size-full h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full">
            {/* Input*/}
        </div>
    </div>
)
}