import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import WhoToFollow from "@/components/WhoToFollow";
import PostGrid from "@/components/PostGrid";
import { currentUser } from "@clerk/nextjs/server";
import FilterBar from "@/components/FilterBar";

// 🔥 SERVER-SIDE SHUFFLE (правильный)
function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export default async function Home() {
  const user = await currentUser();
  const dbUserId = await getDbUserId();

  let postsFromDb = await getPosts();

  // 🔥 ПЕРЕМЕШИВАЕМ НА СЕРВЕРЕ — безопасно
  postsFromDb = shuffle(postsFromDb);

  // Очищаем данные медиа
  const posts = postsFromDb.map((post) => ({
    ...post,
    images: Array.isArray(post.images)
      ? post.images.filter((img): img is { url: string; type: string } =>
          typeof img === "object" &&
          img !== null &&
          "url" in img &&
          "type" in img
        )
      : [],
  }));

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-10 gap-6 max-w-[1200px]"
      style={{ marginRight: "50px" }}
    >
      <div className="lg:col-span-8">
        {user && <CreatePost />}
        <FilterBar posts={posts} dbUserId={dbUserId} />
      </div>

      <div className="hidden lg:block lg:col-span-2 sticky top-20">
        <WhoToFollow />
      </div>
    </div>
  );
}
