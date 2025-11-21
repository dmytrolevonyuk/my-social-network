'use client';

import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";

interface InlineFollowButtonProps {
  userId: string;
  initiallyFollowing?: boolean; 
}

export default function InlineFollowButton({
  userId,
  initiallyFollowing = false,
}: InlineFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(initiallyFollowing);
  const [isPending, start] = useTransition();

  return (
    <Button
      size="sm"
      variant={isFollowing ? "outline" : "default"}
      disabled={isPending}
      onClick={() =>
        start(async () => {
          try {
            await toggleFollow(userId);
            setIsFollowing((v) => !v);
          } catch {
            toast.error("Щось пішло не так");
          }
        })
      }
      className="ml-2 px-3 py-1 text-sm"
    >
      {isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : isFollowing ? "Відписатися" : "Стежити"}
    </Button>
  );
}
