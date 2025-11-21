import { getProfileByUsername, getUserPosts, getUserLikedPosts, isFollowing } from "@/actions/profile.action";
import { getDbUserId } from "@/actions/user.action";
import ProfilePageClient from "./ProfilePageClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: { username: string };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = params;

  // Загружаем профиль
  const user = await getProfileByUsername(username);
  if (!user) return notFound();

  // Загружаем посты и лайкнутые посты
  const posts = await getUserPosts(user.id);
  const likedPosts = await getUserLikedPosts(user.id);

  // ID текущего авторизованного пользователя (в БД)
  const dbUserId = await getDbUserId();

  // Проверяем подписку (вызов твоей функции!)
  const following = dbUserId ? await isFollowing(user.id) : false;

  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={following}
    />
  );
}
