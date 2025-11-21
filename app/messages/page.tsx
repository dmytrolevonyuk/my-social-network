import { getInbox, getRequests } from "@/actions/message.action";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default async function MessagesPage() {
  const [inbox, requests] = await Promise.all([getInbox(), getRequests()]);

  const Item = ({ t }: { t: any }) => {
    const other = t.participants[0]?.user;
    const last = t.messages[0];
    return (
      <Link href={`/messages/${t.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md">
        <Avatar className="w-9 h-9">
          <AvatarImage src={other?.image ?? "/avatar.png"} />
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium truncate">{other?.name ?? other?.username}</div>
          <div className="text-sm text-muted-foreground truncate">
            {last ? `${last.sender.name ?? last.sender.username}: ${last.content}` : "Почніть переписку"}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Вхідні</TabsTrigger>
          <TabsTrigger value="requests">Запити</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <Card className="divide-y">
            {inbox.length ? inbox.map((t: any) => <Item key={t.id} t={t} />) : <div className="p-6 text-muted-foreground">Поки порожньо</div>}
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card className="divide-y">
            {requests.length ? requests.map((t: any) => <Item key={t.id} t={t} />) : <div className="p-6 text-muted-foreground">Запитів немає</div>}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
