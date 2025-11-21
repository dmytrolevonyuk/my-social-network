import { getRandomUsers } from "@/actions/user.action";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";

async function WhoToFollow() {
  const users = await getRandomUsers();

  if (users.length === 0) return null;

  return (
    <Card className="w-72">
  <CardHeader>
    <CardTitle>Можуть вам сподобатися:</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-2">
          <Link href={`/profile/${user.username}`} className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={user.image ?? "/avatar.png"} />
            </Avatar>
            <div className="text-xs">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground">@{user.username}</p>
              <p className="text-muted-foreground">{user._count.followers} підписників</p>
            </div>
          </Link>
          <div className="flex flex-col items-end">
            <FollowButton userId={user.id} />
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>

  );
}
export default WhoToFollow;