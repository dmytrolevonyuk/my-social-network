"use client";

import { useState } from "react";
import PostCard from "./PostCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UploadedFile {
  url: string;
  type: string;
}

export interface PostGridProps {
  posts: {
    id: string;
    images: UploadedFile[];
    _count: { likes: number };
    comments: any[];
    category?: string;
    createdAt?: string;
  }[];
  dbUserId: string | null;
  shuffle?: boolean;
}

export default function PostGrid({ posts, dbUserId }: PostGridProps) {
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[4px] sm:gap-[6px]">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative cursor-pointer group overflow-hidden rounded-md"
            onClick={() => setSelectedPost(post)}
          >
            {post.images?.[0] ? (
              <div className="relative w-full h-[340px] sm:h-[360px] md:h-[380px] overflow-hidden flex items-center justify-center">
                {post.images[0].type === "video" ? (
                  <video
                    src={post.images[0].url}
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-100 opacity-100"
                    muted
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <img
                    src={post.images[0].url}
                    alt="Post preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-[380px] bg-neutral-800 flex items-center justify-center text-gray-400 text-sm">
                Без фото
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition text-white text-sm font-medium">
              ❤️ {post._count.likes}   💬 {post.comments.length}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <PostCard post={selectedPost} dbUserId={dbUserId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
