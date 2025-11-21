'use client';

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "./ui/button";
import { createPost, UploadedFile } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";

function CreatePost() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [category, setCategory] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  

  const categories = [
    { label: "Гарячі", value: "hot" },
    { label: "Холодні", value: "cold" },
    { label: "Супи", value: "soup" },
    { label: "М'ясо", value: "meat" },
    { label: "Напої", value: "drink" },
    { label: "Десерти", value: "dessert" },
  ];

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;
    setIsPosting(true);
    try {
      const result = await createPost(content, images, category);
      if (result?.success) {
        setContent("");
        setImages([]);
        setCategory("");
        setShowImageUpload(false);
        toast.success("Публікацію створено успішно");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Не вдалося створити публікацію");
    } finally {
      setIsPosting(false);
    }
  };


  return (
    <Card className="mb-6 max-w-[calc(100%+80px)] mx-auto">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} />
            </Avatar>
            <Textarea
              placeholder="Опишіть свій рецепт:"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>

         
          {(showImageUpload || images.length > 0) && (
            <div className="border rounded-lg p-4">
              <ImageUpload
                endpoint="postMedia"
                maxFiles={10}
                value={images}
                onChange={(files) => {
                  setImages(files);
                  if (files.length === 0) setShowImageUpload(false);
                }}
              />
            </div>
          )}

      
          <div className="flex flex-wrap gap-2 border-t pt-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
        
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting}
              >
                <ImageIcon className="size-4 mr-2" />
                Фото / Відео
              </Button>

         
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary relative"
                disabled={isPosting}
              >
                {category
                  ? categories.find((c) => c.value === category)?.label
                  : "Оберіть категорію"}
                <select
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isPosting}
                >
                  <option value="">Оберіть категорію</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </Button>
            </div>

         
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary flex items-center"
              onClick={handleSubmit}
              disabled={(content.trim() === "" && images.length === 0) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Публікується...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Опублікувати
                </>
              )}
            </Button>
          </div>

        
          {content && (
            <div
              className="mt-4 p-4 border rounded-lg 
                         bg-white text-black 
                         dark:bg-black dark:text-white"
            >
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                </Avatar>
                <span className="font-semibold">{user?.firstName || "Користувач"}</span>
              </div>
              <div className="whitespace-pre-wrap text-base leading-relaxed">
                {content}
              </div>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`img-${idx}`}
                      className="w-full h-auto rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CreatePost;
