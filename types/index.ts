export type CommentType = {
  id: string;
  content: string;
  authorId: string;
  postId?: string;
  createdAt: string;
  author: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    imageUrl?: string | null;
  };
  likes?: { userId: string }[];
  replies?: CommentType[];
};
