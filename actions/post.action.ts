"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export type UploadedFile = {
  url: string;
  type: string;
};

// мягкая ревалидация
function softRevalidate() {
  setTimeout(() => {
    revalidatePath("/");
  }, 200);
}

/* ------------------------------------- */
/*             CREATE POST               */
/* ------------------------------------- */
export async function createPost(
  content: string,
  images: UploadedFile[],
  category: string
) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const post = await prisma.post.create({
      data: {
        content,
        images: images || [],
        category,
        authorId: userId,
      },
    });

    softRevalidate();
    return { success: true, post };
  } catch (error) {
    console.error("❌ Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

/* ------------------------------------- */
/*              GET POSTS                */
/* ------------------------------------- */
export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true, username: true },
        },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, username: true, image: true, name: true } },
            replies: {
              include: {
                author: { select: { id: true, username: true, image: true, name: true } },
                likes: { select: { userId: true } },
              },
              orderBy: { createdAt: "asc" },
            },
            likes: { select: { userId: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return posts.map((p) => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
    }));
  } catch (error) {
    console.error("❌ Error in getPosts:", error);
    throw new Error("Failed to fetch posts");
  }
}

/* ------------------------------------- */
/*            TOGGLE LIKE POST           */
/* ------------------------------------- */
export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) return;

    if (existing) {
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await prisma.like.create({
        data: { userId, postId },
      });

      // 🔥 уведомление: лайк поста
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            creatorId: userId,
            type: "LIKE",
            postId,
          },
        });
      }
    }

    softRevalidate();
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to toggle like:", error);
    return { success: false };
  }
}

/* ------------------------------------- */
/*            CREATE COMMENT             */
/* ------------------------------------- */
export async function createComment(
  postId: string,
  content: string,
  parentId?: string
) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!content.trim()) return { success: false, error: "Empty" };

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    });

    // 🔍 получаем автора поста
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    // 🔍 получаем автора родительского комментария (если это ответ)
    let parentAuthorId = null;
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      parentAuthorId = parent?.authorId ?? null;
    }

    // 🔥 уведомление: обычный комментарий
    if (!parentId && post?.authorId && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          creatorId: userId,
          type: "COMMENT",
          postId,
          commentId: comment.id,
        },
      });
    }

    // 🔥 уведомление: ответ на комментарий
    if (parentId && parentAuthorId && parentAuthorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: parentAuthorId,
          creatorId: userId,
          type: "COMMENT_REPLY",
          postId,
          commentId: parentId,
          replyCommentId: comment.id,
        },
      });
    }

    softRevalidate();
    return { success: true, comment };
  } catch (error) {
    console.error("❌ Failed to create comment:", error);
    return { success: false };
  }
}

/* ------------------------------------- */
/*         TOGGLE LIKE COMMENT           */
/* ------------------------------------- */
export async function toggleCommentLike(commentId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });

    if (!comment) return;

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.commentLike.create({
        data: { userId, commentId },
      });

      // 🔥 уведомление: лайк комментария
      if (comment.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: comment.authorId,
            creatorId: userId,
            type: "COMMENT_LIKE",
            commentId,
            postId: comment.postId,
          },
        });
      }
    }

    softRevalidate();
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to toggle comment like:", error);
    return { success: false };
  }
}

/* ------------------------------------- */
/*            DELETE COMMENT             */
/* ------------------------------------- */
export async function deleteComment(commentId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment || comment.authorId !== userId)
      return { success: false, error: "Unauthorized" };

    await prisma.comment.delete({ where: { id: commentId } });

    softRevalidate();
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to delete comment:", error);
    return { success: false };
  }
}

/* ------------------------------------- */
/*             GET POST BY ID            */
/* ------------------------------------- */
export async function getPostById(postId: string) {
  try {
    return await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true, name: true, image: true },
        },
        likes: { select: { userId: true } },
        comments: {
          where: { parentId: null },
          include: {
            author: { select: { id: true, username: true, name: true, image: true } },
            likes: { select: { userId: true } },
            replies: {
              include: {
                author: { select: { id: true, username: true, name: true, image: true } },
                likes: { select: { userId: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching post:", error);
    return null;
  }
}
export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post || post.authorId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.post.delete({ where: { id: postId } });

    softRevalidate();
    return { success: true };
  } catch (err) {
    console.error("❌ deletePost error:", err);
    return { success: false, error: "Failed to delete post" };
  }
}