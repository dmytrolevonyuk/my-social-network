"use client";

import { XIcon } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { generateUploadDropzone } from "@uploadthing/react";
import type { UploadedFile } from "@/actions/post.action"; 

interface ImageUploadProps {
  onChange: (files: UploadedFile[]) => void;
  value: UploadedFile[];
  endpoint: "postMedia";
  maxFiles?: number;
}

const UploadDropzone = generateUploadDropzone<OurFileRouter>();

function ImageUpload({
  endpoint,
  onChange,
  value,
  maxFiles = 10,
}: ImageUploadProps) {
  const handleRemove = (url: string) => {
    const updated = value.filter((item) => item.url !== url);
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap gap-4">
      {value.map((file) => (
        <div key={file.url} className="relative w-40 h-40">
          {file.type === "video" ? (
            <video
              src={file.url}
              controls
              className="rounded-md w-full h-full object-cover"
            />
          ) : (
            <img
              src={file.url}
              alt="Uploaded"
              className="rounded-md w-full h-full object-cover"
            />
          )}
          <button
            onClick={() => handleRemove(file.url)}
            className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
            type="button"
          >
            <XIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      ))}

      {value.length < maxFiles && (
        <div className="w-50 h-40 flex items-center justify-center overflow-hidden mt-[-20px] ml-[180px]">
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <UploadDropzone
              endpoint={endpoint}
              onClientUploadComplete={(res) => {
                if (!res) return;
                const newFiles: UploadedFile[] = res.map((file) => ({
                  url: file.serverData.fileUrl,
                  type: file.serverData.fileType.startsWith("video")
                    ? "video"
                    : "image",
                }));
                onChange([...value, ...newFiles]);
              }}
              onUploadError={(error: Error) =>
                console.error("Upload error:", error)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
