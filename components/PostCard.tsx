"use client";

import {
  createComment,
  deletePost,
  toggleLike,
  toggleCommentLike,
  deleteComment,
} from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { CommentType } from "@/types";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { getUserAvatar } from "@/lib/getUserAvatar";
import { Button } from "./ui/button";
import {
  HeartIcon,
  LogInIcon,
  MessageCircleIcon,
  SendIcon,
  ChevronLeft,
  ChevronRight,
  XIcon,
  SmileIcon,
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import InlineFollowButton from "./FollowInlineButton";

import * as RadixPopover from "@radix-ui/react-popover";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

export type Post = {
  id: string;
  content: string | null;
  authorId: string;
  author: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    imageUrl?: string | null;
  };
  createdAt: string;
  images: { url: string; type: string }[] | any;
  likes: { userId: string }[];
  _count: { likes: number };
  comments: CommentType[];
};

interface PostCardProps {
  post: Post;
  dbUserId: string | null;
  isFollowingAuthor?: boolean;
}

export default function PostCard({
  post,
  dbUserId,
  isFollowingAuthor = false,
}: PostCardProps) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState<string>("");
  const [comments, setComments] = useState<CommentType[]>(post.comments || []);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [hasLiked, setHasLiked] = useState(
    Array.isArray(post.likes)
      ? post.likes.some((like) => like.userId === dbUserId)
      : false
  );

  const [optimisticLikes, setOptimisticLikes] = useState(post._count?.likes ?? 0);
  const [currentMedia, setCurrentMedia] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [commentLikeLoading, setCommentLikeLoading] = useState<
    Record<string, boolean>
  >({});
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(
    null
  );
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const media = Array.isArray(post.images) ? post.images : [];

  const nextMedia = () => setCurrentMedia((prev) => (prev + 1) % media.length);
  const prevMedia = () =>
    setCurrentMedia((prev) => (prev - 1 + media.length) % media.length);

  const renderWithMentions = (text: string) => {
    const parts: Array<string | JSX.Element> = [];
    const regex = /@([a-zA-Z0-9_]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      const username = match[1];
      parts.push(
        <Link
          key={`${username}-${match.index}`}
          href={`/profile/${username}`}
          className="text-sky-500 hover:text-sky-400 font-medium"
        >
          @{username}
        </Link>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const formatLikes = (count: number) => {
    if (count === 0) return "";
    if (count === 1) return "1 вподобання";
    return `позначки "подобається": ${count}`;
  };

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptimisticLikes((prev) => prev + (hasLiked ? -1 : 1));
      await toggleLike(post.id);
    } catch {
      setOptimisticLikes(post._count.likes);
      setHasLiked(post.likes.some((like) => like.userId === dbUserId));
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, text, replyTo?.id);
      if (result?.success && result.comment) {
        const created = {
          id: result.comment.id,
          content: result.comment.content,
          authorId: result.comment.authorId,
          author: result.comment.author,
          createdAt: new Date().toISOString(),
          postId: post.id,
          likes: [],
          replies: [],
        };
        if (replyTo?.id) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...(c.replies || []), created as CommentType] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, created]);
        }
        setNewComment("");
        setReplyTo(null);
        toast.success("Коментар успішно опубліковано");
      }
    } catch {
      toast.error("Не вдалося залишити коментар");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const symbol = emoji?.native ?? "";
    if (!symbol) return;
    if (!textareaRef.current) {
      setNewComment((prev) => prev + symbol);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const text = newComment;
    const updated = text.slice(0, start) + symbol + text.slice(end);
    setNewComment(updated);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const pos = start + symbol.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleToggleCommentLike = async (commentId: string, isReply = false) => {
    if (commentLikeLoading[commentId]) return;
    try {
      setCommentLikeLoading((s) => ({ ...s, [commentId]: true }));
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId && !isReply) {
            const has = c.likes?.some((l) => l.userId === dbUserId);
            return {
              ...c,
              likes: has
                ? c.likes?.filter((l) => l.userId !== dbUserId)
                : [...(c.likes || []), { userId: dbUserId! }],
            };
          }
          return {
            ...c,
            replies: c.replies?.map((r) => {
              if (r.id === commentId && isReply) {
                const has = r.likes?.some((l) => l.userId === dbUserId);
                return {
                  ...r,
                  likes: has
                    ? r.likes?.filter((l) => l.userId !== dbUserId)
                    : [...(r.likes || []), { userId: dbUserId! }],
                };
              }
              return r;
            }),
          };
        })
      );
      await toggleCommentLike(commentId);
    } catch {
      toast.error("Не вдалося поставити лайк");
    } finally {
      setCommentLikeLoading((s) => ({ ...s, [commentId]: false }));
    }
  };

  const handleDeleteComment = async (
    commentId: string,
    isReply = false,
    parentId?: string
  ) => {
    try {
      const result = await deleteComment(commentId);

      if (!result) {
        toast.error("Не вдалося видалити коментар");
        return;
      }

      if (result.success) {
        setComments((prev) =>
          isReply
            ? prev.map((c) =>
                c.id === parentId
                  ? { ...c, replies: c.replies?.filter((r) => r.id !== commentId) }
                  : c
              )
            : prev.filter((c) => c.id !== commentId)
        );
        toast.success("Коментар видалено");
      } else {
        toast.error(result.error || "Не вдалося видалити коментар");
      }
    } catch {
      toast.error("Помилка при видаленні коментаря");
    }
  };

  const startReply = (parentId: string, username: string) => {
    setReplyTo({ id: parentId, username });
    const mention = `@${username} `;
    setNewComment((prev) => (prev.startsWith(mention) ? prev : mention + prev));
  };

  return (
    <Card className="overflow-hidden mx-auto w-[calc(90vw+60px)] max-w-[960px] h-[calc(85vh+60px)] max-h-[760px]">
      <CardContent className="p-0 flex bg-background h-full">
        {/* LEFT MEDIA PANEL */}
        <div className="relative flex items-center justify-center bg-black flex-1 h-full overflow-hidden">
          {post.images?.length ? (
            <>
              {post.images[currentMedia].type === "video" ? (
                <video
                  key={post.images[currentMedia].url}
                  ref={videoRef}
                  src={post.images[currentMedia].url}
                  controls
                  playsInline
                  className="max-h-full max-w-none"
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    const aspect = video.videoWidth / video.videoHeight;
                    if (aspect < 1) {
                      video.style.height = "100%";
                      video.style.width = "auto";
                      video.style.objectFit = "cover";
                    } else {
                      video.style.width = "100%";
                      video.style.height = "auto";
                      video.style.objectFit = "contain";
                    }
                  }}
                />
              ) : (
                <img
                  key={post.images[currentMedia].url}
                  src={post.images[currentMedia].url}
                  alt="Post media"
                  className="max-w-full max-h-full object-contain bg-black"
                />
              )}

              {post.images.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={nextMedia}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="text-gray-400">Без медіа</div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col justify-between w-1/2 border-l">

          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.username || post.author.id}`}
                className="flex items-center gap-2"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={getUserAvatar(post.author)} />
                </Avatar>
                <span className="font-semibold text-primary">
                  {post.author.username || `user${post.author.id.slice(0, 5)}`}
                </span>
              </Link>

              {dbUserId !== post.author.id && user && (
                <InlineFollowButton
                  userId={post.author.id}
                  initiallyFollowing={isFollowingAuthor}
                />
              )}
            </div>

            {dbUserId === post.author.id && (
              <DeleteAlertDialog
                isDeleting={isDeleting}
                onDelete={async () => {
                  setIsDeleting(true);

                  const result = await deletePost(post.id);

                  if (!result) {
                    toast.error("Помилка при видаленні допису");
                    setIsDeleting(false);
                    return;
                  }

                  if (result.success) {
                    toast.success("Допис видалено");
                  } else {
                    toast.error(result.error || "Не вдалося видалити допис");
                  }

                  setIsDeleting(false);
                }}
              />
            )}
          </div>

          {/* UNIFIED SCROLL AREA — DESCRIPTION + COMMENTS  */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* POST DESCRIPTION WITH FORMATTING */}
            {post.content && (
              <div className="text-sm leading-relaxed border-b pb-3 whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {/* COMMENTS */}
            {comments.map((comment) => {
              const authorUsername =
                comment.author.username || `user${comment.author.id.slice(0, 5)}`;
              const isRepliesVisible = showReplies[comment.id];

              return (
                <div key={comment.id} className="group relative">
                  <div className="flex items-start gap-3">

                    {/* AVATAR */}
                    <Link href={`/profile/${authorUsername}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getUserAvatar(comment.author)} />
                      </Avatar>
                    </Link>

                    <div className="flex-1 flex justify-between w-full">
                      <div className="min-w-0">
                        <div className="text-sm leading-snug break-words">
                          <Link
                            href={`/profile/${authorUsername}`}
                            className="font-medium hover:underline"
                          >
                            {authorUsername}
                          </Link>{" "}
                          {renderWithMentions(comment.content)}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: uk,
                            })}
                          </span>

                          {!!comment.likes?.length && (
                            <span>{formatLikes(comment.likes.length)}</span>
                          )}

                          {user && (
                            <button
                              onClick={() =>
                                startReply(comment.id, authorUsername)
                              }
                              className="hover:text-primary"
                            >
                              Відповісти
                            </button>
                          )}
                        </div>

                        {/* DELETE BUTTON */}
                        {dbUserId === comment.authorId && (
                          <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <DeleteAlertDialog
                              isDeleting={isDeleting}
                              onDelete={() =>
                                handleDeleteComment(comment.id, false)
                              }
                            />
                          </div>
                        )}

                        {!!comment.replies?.length && !isRepliesVisible && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="text-xs text-muted-foreground hover:text-primary mt-1"
                          >
                            Показати відповіді ({comment.replies.length})
                          </button>
                        )}

                        {/* REPLIES */}
                        {isRepliesVisible && (
                          <div className="mt-6 space-y-2">
                            {(comment.replies || []).map((r) => {
                              const ru =
                                r.author.username ||
                                `user${r.author.id.slice(0, 5)}`;

                              return (
                                <div
                                  key={r.id}
                                  className="group relative flex justify-between w-full items-start"
                                >
                                  <div className="relative flex-1 pl-[44px] pr-[36px] min-w-0">
                                    <Link
                                      href={`/profile/${ru}`}
                                      className="absolute left-0 top-0"
                                    >
                                      <Avatar className="w-7 h-7">
                                        <AvatarImage
                                          src={getUserAvatar(r.author)}
                                        />
                                      </Avatar>
                                    </Link>

                                    <div className="text-sm leading-snug break-words">
                                      <Link
                                        href={`/profile/${ru}`}
                                        className="font-medium hover:underline"
                                      >
                                        {ru}
                                      </Link>{" "}
                                      {renderWithMentions(r.content)}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                      <span>
                                        {formatDistanceToNow(
                                          new Date(r.createdAt),
                                          {
                                            addSuffix: true,
                                            locale: uk,
                                          }
                                        )}
                                      </span>

                                      {!!r.likes?.length && (
                                        <span>
                                          {formatLikes(r.likes.length)}
                                        </span>
                                      )}

                                      {user && (
                                        <button
                                          onClick={() =>
                                            startReply(comment.id, ru)
                                          }
                                          className="hover:text-primary"
                                        >
                                          Відповісти
                                        </button>
                                      )}
                                    </div>

                                    {dbUserId === r.authorId && (
                                      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <DeleteAlertDialog
                                          isDeleting={isDeleting}
                                          onDelete={() =>
                                            handleDeleteComment(
                                              r.id,
                                              true,
                                              comment.id
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() =>
                                      handleToggleCommentLike(r.id, true)
                                    }
                                    disabled={!user}
                                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                    aria-label="Like reply"
                                  >
                                    <HeartIcon
                                      className={`w-4 h-4 ${
                                        r.likes?.some(
                                          (l) => l.userId === dbUserId
                                        )
                                          ? "text-red-500 fill-current"
                                          : ""
                                      }`}
                                    />
                                  </button>
                                </div>
                              );
                            })}

                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="text-xs text-muted-foreground hover:text-primary mt-1 ml-[44px]"
                            >
                              Сховати відповіді
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LIKE BUTTON */}
                      <button
                        onClick={() => handleToggleCommentLike(comment.id)}
                        disabled={!user}
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Like comment"
                      >
                        <HeartIcon
                          className={`w-4 h-4 ${
                            comment.likes?.some(
                              (l) => l.userId === dbUserId
                            )
                              ? "text-red-500 fill-current"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="border-t p-4">
            {/* Reply indicator */}
            {replyTo && (
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <span>
                  Відповідь <b>@{replyTo.username}</b>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="hover:text-primary"
                  aria-label="Cancel reply"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Likes + time */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-4">
                {user ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`gap-2 ${
                      hasLiked
                        ? "text-red-500 hover:text-red-600"
                        : "hover:text-red-500"
                    }`}
                  >
                    <HeartIcon
                      className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`}
                    />
                    <span>{optimisticLikes}</span>
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-2"
                    >
                      <HeartIcon className="w-5 h-5" />
                      <span>{optimisticLikes}</span>
                    </Button>
                  </SignInButton>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2 hover:text-blue-500"
                >
                  <MessageCircleIcon className="w-5 h-5" />
                  <span>{comments.length}</span>
                </Button>
              </div>

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: uk,
                })}
              </span>
            </div>

            {/* Comment input */}
            {user ? (
              <div className="flex space-x-3">
                <RadixPopover.Root
                  open={isEmojiOpen}
                  onOpenChange={setIsEmojiOpen}
                  modal={false}
                >
                  <RadixPopover.Trigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Open emoji picker"
                    >
                      <SmileIcon className="w-5 h-5" />
                    </Button>
                  </RadixPopover.Trigger>

                  <RadixPopover.Portal>
                    <RadixPopover.Content
                      side="top"
                      align="start"
                      sideOffset={8}
                      className="z-[9999] pointer-events-auto rounded-xl border bg-background p-0 shadow-md outline-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="auto"
                        previewPosition="none"
                        skinTonePosition="search"
                      />
                    </RadixPopover.Content>
                  </RadixPopover.Portal>
                </RadixPopover.Root>

                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Залишити коментар..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[50px] resize-none pr-12"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!newComment.trim() || isCommenting}
                    onClick={handleAddComment}
                    className="absolute right-2 bottom-2 text-muted-foreground hover:text-primary"
                    aria-label="Send comment"
                  >
                    {isCommenting ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <SendIcon className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <SignInButton mode="modal">
                  <Button variant="outline" className="gap-2">
                    <LogInIcon className="w-4 h-4" />
                    Увійти для коментування
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
