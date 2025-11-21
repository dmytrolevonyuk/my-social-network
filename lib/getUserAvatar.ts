import type { UserResource } from "@clerk/types";


interface PrismaUser {
  id?: string | null;
  clerkid?: string | null;
  image?: string | null;
}


type AnyUser = PrismaUser | UserResource | null | undefined;

export function getUserAvatar(user: AnyUser): string {

  if (!user) return "/avatar.png";

  try {

    if ("profileImageUrl" in user && typeof user.profileImageUrl === "string")
      return user.profileImageUrl;

    if ("imageUrl" in user && typeof user.imageUrl === "string")
      return user.imageUrl;

    if ("image" in user && typeof user.image === "string")
      return user.image;

    if ("clerkid" in user && typeof user.clerkid === "string")
      return `https://img.clerk.com/${user.clerkid}`;

    return "/avatar.png";
  } catch (err) {
    console.warn("⚠️ getUserAvatar error:", err);
    return "/avatar.png";
  }
}
