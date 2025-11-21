import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  postMedia: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    video: { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Неавторизований користувач");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        fileUrl: file.url,
        fileType: file.type,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
