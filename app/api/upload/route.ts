import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type DmAttachment = {
  url: string;
  type: "image" | "video" | "pdf" | "other";
  name?: string;
};

function mapType(mime: string, format?: string): DmAttachment["type"] {
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (mime === "application/pdf" || format === "pdf") return "pdf";
  return "other";
}


const MAX_FILES = 10;
const MAX_SIZE_BYTES = 25 * 1024 * 1024; 
const ALLOWED_PREFIXES = ["image/", "video/", "application/pdf"];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ attachments: [] });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: "too_many_files", message: `Максимум ${MAX_FILES} файлів` },
        { status: 400 }
      );
    }

    const folder = process.env.CLOUDINARY_FOLDER || "dm-attachments";

    const uploads = await Promise.all(
      files.map(async (file) => {
        
        const isAllowed = ALLOWED_PREFIXES.some((p) =>
          file.type === "application/pdf" ? true : file.type.startsWith(p)
        );
        if (!isAllowed) {
          throw new Error(`unsupported_type:${file.type}`);
        }
        if (file.size > MAX_SIZE_BYTES) {
          throw new Error(`too_big:${file.name}`);
        }

        
        const bytes = await file.arrayBuffer();
        const b64 = Buffer.from(bytes).toString("base64");
        const dataUri = `data:${file.type};base64,${b64}`;

        const res = await cloudinary.uploader.upload(dataUri, {
          folder,
          resource_type: "auto",
        });

        const att: DmAttachment = {
          url: res.secure_url,
          type: mapType(file.type, res.format),
          name: file.name || res.original_filename || res.public_id.split("/").pop(),
        };
        return att;
      })
    );

    return NextResponse.json({ attachments: uploads });
  } catch (err: any) {
    
    console.error("Upload error:", err?.message || err);
    const msg =
      typeof err?.message === "string" ? err.message : "upload_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
