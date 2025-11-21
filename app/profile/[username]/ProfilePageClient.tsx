"use client";

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import { startThread } from "@/actions/message.action";
import PostGrid from "@/components/PostGrid";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  EditIcon,
  FileTextIcon,
  HeartIcon,
  MapPinIcon,
  LinkIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type PostFromDb = Awaited<ReturnType<typeof getUserPosts>>[number];

type UploadedFile = { url: string; type: string };

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: PostFromDb[];
  likedPosts: PostFromDb[];
  isFollowing: string | number | boolean | null;
}

function toBool(v: string | number | boolean | null | undefined): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

export default function ProfilePageClient({
  user,
  posts,
  likedPosts,
  isFollowing: rawIsFollowing
}: ProfilePageClientProps) {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [isPendingDM, startDM] = useTransition();

  // FIX boolean type
  const [isFollowing, setIsFollowing] = useState<boolean>(toBool(rawIsFollowing));
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  // FIX normalize posts
  const normalizePosts = (rawPosts: PostFromDb[]) =>
    rawPosts.map((post) => ({
      ...post,
      createdAt: (post.createdAt instanceof Date)
        ? post.createdAt.toISOString()
        : post.createdAt,

      images: Array.isArray(post.images)
        ? post.images.filter(
            (img): img is UploadedFile =>
              img && typeof img === "object" && "url" in img && "type" in img
          )
        : [],

      comments: Array.isArray(post.comments) ? post.comments : [],
    }));

  const safePosts = normalizePosts(posts);
  const safeLikedPosts = normalizePosts(likedPosts);

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0]?.emailAddress.split("@")[0] === user.username;

  // Follow
  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      setIsUpdatingFollow(true);
      await toggleFollow(user.id);
      setIsFollowing((prev) => !prev); // FIX
    } catch {
      toast.error("Не вдалося оновити статус підписки");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  // DM
  const handleStartDM = () => {
    if (!currentUser) return;

    startDM(async () => {
      try {
        const threadId = await startThread(user.id);
        router.push(`/messages/${threadId}`);
      } catch {
        toast.error("Не вдалося відкрити повідомлення");
      }
    });
  };

  // Save profile
  const handleEditSubmit = async () => {
    const formData = new FormData();
    Object.entries(editForm).forEach(([k, v]) => formData.append(k, v));

    const result = await updateProfile(formData);

    if (result.success) {
      setShowEditDialog(false);
      toast.success("Профіль успішно оновлено");
      router.refresh();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:gap-10 pb-8 border-b border-border">
        <div className="flex justify-center md:justify-start w-full md:w-auto">
          <Avatar className="w-36 h-36 border border-border rounded-full">
            <AvatarImage src={user.image ?? "/avatar.png"} />
          </Avatar>
        </div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left mt-6 md:mt-0 w-full">

          {/* NAME + BUTTONS */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <h1 className="text-2xl font-semibold">{user.name ?? user.username}</h1>

            {!currentUser ? (
              <SignInButton mode="modal">
                <Button className="mt-3 md:mt-0">Стежити</Button>
              </SignInButton>
            ) : isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 md:mt-0"
                onClick={() => setShowEditDialog(true)}
              >
                <EditIcon className="w-4 h-4 mr-2" />
                Редагувати профіль
              </Button>
            ) : (
              <div className="flex gap-2 mt-3 md:mt-0">
                <Button
                  onClick={handleFollow}
                  disabled={isUpdatingFollow}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                >
                  {isFollowing ? "Відписатися" : "Стежити"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartDM}
                  disabled={isPendingDM}
                >
                  Повідомлення
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-2">@{user.username}</p>

          {user.bio && <p className="mt-3 max-w-md">{user.bio}</p>}

          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-5 text-sm">
            <span><strong>{user._count.posts}</strong> публікацій</span>
            <span>•</span>
            <span>Читачі: <strong>{user._count.followers}</strong></span>
            <span>•</span>
            <span>Стежить: <strong>{user._count.following}</strong></span>
          </div>

          <div className="mt-4 text-sm text-muted-foreground space-y-1">
            {user.location && (
              <div className="flex items-center justify-center md:justify-start gap-1">
                <MapPinIcon className="w-4 h-4" /> {user.location}
              </div>
            )}

            {user.website && (
              <div className="flex items-center justify-center md:justify-start gap-1">
                <LinkIcon className="w-4 h-4" />
                <a
                  href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                  className="hover:underline text-blue-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user.website}
                </a>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="posts" className="w-full mt-8">
        <TabsList className="w-full justify-center border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="posts" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold">
            <FileTextIcon className="w-4 h-4" /> Публікації
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 font-semibold">
            <HeartIcon className="w-4 h-4" /> Збережені
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {safePosts.length > 0 ? (
            <PostGrid posts={safePosts} dbUserId={user.id} shuffle={false} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Дописів ще немає
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          {safeLikedPosts.length > 0 ? (
            <PostGrid posts={safeLikedPosts} dbUserId={user.id} shuffle={false} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Немає вподобаних публікацій для показу
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* EDIT DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редагувати профіль</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ім'я</Label>
              <Input
                name="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Про себе</Label>
              <Textarea
                name="bio"
                value={editForm.bio}
                className="min-h-[100px]"
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Місцезнаходження</Label>
              <Input
                name="location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Веб-сайт</Label>
              <Input
                name="website"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">Скасувати</Button>
            </DialogClose>

            <Button onClick={handleEditSubmit}>Зберегти зміни</Button>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
