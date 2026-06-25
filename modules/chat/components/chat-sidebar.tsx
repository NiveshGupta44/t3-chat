"use client";

import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input"
import {cn} from "@/lib/utils"
import UserButton from "@/modules/authentication/components/user-button";
import { PlusIcon, SearchIcon, EllipsisIcon, Trash } from "lucide-react";
import  Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import {isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


const ChatSidebar=()=>{

    const[searchQuery, setSearchQuery]= useState("")
    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
            {/*Header*/} 
            <div className="flex items-center border-b border-sidebar-border px-4 py-3">
            <Image src="/logo.svg" alt="Logo" width={100} height={100}></Image>
        </div>
        <div className="p-4">
            <Button asChild className="w-full">
                <Link href="/">
                <PlusIcon className="mr-2 h-4 w-4"/>
                New Chat
                </Link>
            </Button>

        </div>
        <div className="px-4 pb-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                <Input
                placeholder="Search your threads..."
                className="pl-9 pr-8 bg-sidebar-accent border-sidebar-border"
                value={searchQuery}
                onChange={(e) =>setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        </div>
        
    )
}

export default ChatSidebar