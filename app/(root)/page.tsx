import UserButton from "@/modules/authentication/components/user-button";
import { currentUser } from "@/modules/authentication/actions";
import ChatMessageView from "@/modules/chat/components/chat-message-view";
import { Button } from "@/components/ui/button";
import Image from "next/image";


export default async function Home() {
  const user = await currentUser();

  return (
    <>
    <ChatMessageView user={user}/>
    </>
  );
}