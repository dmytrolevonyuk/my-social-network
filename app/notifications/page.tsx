"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import {
  getNotifications,
  markNotificationsAsRead,
} from "@/actions/notification.action";
import { getPostById } from "@/actions/post.action";

import { NotificationsSkeleton } from "@/components/NotificationSkeleton";
import PostCard from "@/components/PostCard";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HeartIcon,
  MessageCircleIcon,
  UserPlusIcon,
  PlayIcon,
} from "lucide-react";

type Notifications = Awaited<ReturnType<typeof getNotifications>>;
type Notification = Notifications[number];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-red-500" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case "COMMENT_REPLY":
      return <MessageCircleIcon className="size-4 text-purple-500" />;
    case "COMMENT_LIKE":
      return <HeartIcon className="size-4 text-pink-500" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-green-500" />;
    default:
      return null;
  }
};

const getPreviewMedia = (images: any): { url: string; type: string } | null => {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) {
    const item = images[0];
    if (typeof item === "string") return { url: item, type: "image" };
    if (item.url && item.type) return item;
  }
  if (typeof images === "string") return { url: images, type: "image" };
  return null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);
        const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) await markNotificationsAsRead(unreadIds);
      } catch {
        toast.error("Не вдалося отримати сповіщення");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const openPost = async (postId: string) => {
    try {
      const post = await getPostById(postId);
      if (!post) return toast.error("Пост не знайдено");
      setSelectedPost(post);
      document.body.style.overflow = "hidden";
    } catch {
      toast.error("Не вдалося відкрити пост");
    }
  };

  const closePost = useCallback(() => {
    setSelectedPost(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePost();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePost]);

  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Сповіщення</CardTitle>
            <span className="text-sm text-muted-foreground">
              {notifications.filter((n) => !n.read).length} непрочитаних
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Немає сповіщень
              </div>
            ) : (
              notifications.map((notification) => {
                const media = getPreviewMedia(notification.post?.images);
                const nType = notification.type;

                const text =
                  nType === "FOLLOW"
                    ? "почав стежити за вами"
                    : nType === "LIKE"
                    ? "вподобав ваш пост"
                    : nType === "COMMENT"
                    ? "залишив коментар"
                    : nType === "COMMENT_REPLY"
                    ? "відповів на ваш коментар"
                    : nType === "COMMENT_LIKE"
                    ? "вподобав ваш коментар"
                    : "";

                const showPostPreview =
                  ["LIKE", "COMMENT", "COMMENT_REPLY", "COMMENT_LIKE"].includes(
                    nType
                  );

                return (
                  <div
                    key={notification.id}
                    onClick={() =>
                      showPostPreview && notification.post?.id
                        ? openPost(notification.post.id)
                        : null
                    }
                    className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors ${
                      !notification.read ? "bg-muted/50" : ""
                    } cursor-pointer`}
                  >
                    <Avatar className="mt-1">
                      <AvatarImage
                        src={notification.creator.image ?? "/avatar.png"}
                      />
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(nType)}
                        <span>
                          <span className="font-medium">
                            {notification.creator.name ??
                              notification.creator.username}
                          </span>{" "}
                          {text}
                        </span>
                      </div>

                  
                      <div className="pl-6 space-y-2">
                        {(nType === "COMMENT" ||
                          nType === "COMMENT_REPLY" ||
                          nType === "COMMENT_LIKE") && (
                          <div className="space-y-2 text-sm">
                            {notification.comment?.content && (
                              <div className="bg-accent/50 rounded-md p-2">
                                <span className="font-semibold">
                                  {nType === "COMMENT_LIKE"
                                    ? "Ваш коментар:"
                                    : "Коментар:"}
                                </span>{" "}
                                {notification.comment.content}
                              </div>
                            )}

                            {nType === "COMMENT_REPLY" &&
                              notification.replyComment?.content && (
                                <div className="bg-accent/30 rounded-md p-2">
                                  <span className="font-semibold">
                                    Відповідь:
                                  </span>{" "}
                                  {notification.replyComment.content}
                                </div>
                              )}
                          </div>
                        )}

                        {showPostPreview && notification.post && media && (
                          <div className="relative mt-1 w-36 h-36 rounded-md overflow-hidden border bg-muted/30">
                            {media.type === "video" ? (
                              <>
                                <video
                                  src={media.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <PlayIcon className="w-6 h-6 text-white" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={media.url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground pl-6">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: uk,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={closePost}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-[95vw] max-h-[95vh] w-full flex justify-center items-center"
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                e.stopPropagation()
              }
            >
              <PostCard
                post={selectedPost}
                dbUserId={selectedPost.authorId}
                isFollowingAuthor={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
