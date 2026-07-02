/*
  Warnings:

  - You are about to drop the column `MessageType` on the `message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."message" DROP COLUMN "MessageType",
ADD COLUMN     "messageType" "public"."MessageType" NOT NULL DEFAULT 'NORMAL';
