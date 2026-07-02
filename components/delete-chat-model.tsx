"use client";
import Modal from "@/components/ui/modal";
import { useDeleteChat } from "@/modules/chat/hooks/chat";
import { useRouter } from "next/navigation";

import React, { startTransition, useEffect } from "react";
import { toast } from "sonner";

const DeleteChatModal = ({ isModalOpen, setIsModalOpen, chatId }) => {
  const { mutateAsync, isPending } = useDeleteChat(chatId);
  const router = useRouter();

  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.pointerEvents = "";
    }
  }, [isModalOpen]);

  if (!chatId) return null;

  const handleDelete = async () => {
    try {
      await mutateAsync(chatId);
      toast.success("Chat Deleted");
      startTransition(() => {
        router.push("/");
      });
    } catch (e) {
      console.error("Delete failed:", e); 
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <Modal
      title="Delete Chat"
      description="Are you sure you want to delete this Chat? This action cannot be undone."
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleDelete}
      submitText={isPending ? "Deleting..." : "Delete"}
      submitVariant="destructive"
    >
      <p className="text-sm text-zinc-500">
        Once deleted, all requests and data in this Chat will be permanently
        removed.
      </p>
    </Modal>
  );
};

export default DeleteChatModal;
