import { acceptRequest, getThread } from "@/actions/message.action";
import { getDbUserId } from "@/actions/user.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import MessageComposer from "./MessageComposer";
import MessageBubble from "./MessageBubble";

export default async function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  const meId = await getDbUserId();
  if (!meId) notFound();

  const thread = await getThread(params.threadId);
  if (!thread) notFound();

  const myParticipant = thread.participants.find((p: any) => p.userId === meId) ?? null;

 
  let other =
    thread.participants.find((p: any) => p.userId !== meId)?.user ??
    thread.messages.find((m: any) => m.senderId !== meId)?.sender;

  if (!myParticipant || !other) notFound();

  const isPending = myParticipant.status === "PENDING";

  async function accept() {
    "use server";
    await acceptRequest(params.threadId);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-200px)]">
     
      <div className="flex items-center gap-3 border-b pb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={other.image ?? "/avatar.png"} />
        </Avatar>
        <div className="font-medium">
          {other.name ?? other.username ?? "Користувач"}
        </div>
      </div>

   
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {thread.messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Тут поки що немає повідомлень. Напишіть першим.
          </div>
        )}

        {thread.messages.map((m: any) => (
          <MessageBubble
            key={m.id}
            id={m.id}
            mine={m.senderId === meId}
            content={m.content}
            attachments={Array.isArray(m.attachments) ? m.attachments : []}
          />
        ))}
      </div>

     
      {isPending ? (
        <div className="border-t pt-3 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Цей запит на листування від {other.name ?? other.username}. Прийняти?
          </div>
          <form action={accept}>
            <Button type="submit">Прийняти</Button>
          </form>
        </div>
      ) : (
        
        <MessageComposer threadId={params.threadId} />
      )}
    </div>
  );
}
