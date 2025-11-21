-- DropIndex
DROP INDEX "Comment_authorId_postId_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "replyCommentId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_replyCommentId_fkey" FOREIGN KEY ("replyCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
