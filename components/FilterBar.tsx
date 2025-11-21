"use client";

import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import PostGrid from "./PostGrid";

interface FilterBarProps {
  posts: any[];
  dbUserId: string | null;
}

export default function FilterBar({ posts, dbUserId }: FilterBarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [sortByNew, setSortByNew] = useState<"asc" | "desc" | null>(null);
  const [sortByPopular, setSortByPopular] = useState<"asc" | "desc" | null>(null);

  const categories = [
    { label: "Усі", value: null },
    { label: "Гарячі", value: "hot" },
    { label: "Холодні", value: "cold" },
    { label: "Супи", value: "soup" },
    { label: "М'ясо", value: "meat" },
    { label: "Напої", value: "drink" },
    { label: "Десерти", value: "dessert" },
  ];

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (selectedCategory) {
      result = result.filter((post) => post.category === selectedCategory);
    }

    if (sortByPopular) {
      result.sort((a, b) => {
        const likesDiff = sortByPopular === "desc"
          ? b._count.likes - a._count.likes
          : a._count.likes - b._count.likes;

        if (likesDiff !== 0) return likesDiff;

        return sortByPopular === "desc"
          ? b.comments.length - a.comments.length
          : a.comments.length - b.comments.length;
      });
    }

    else if (sortByNew) {
      result.sort((a, b) =>
        sortByNew === "desc"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return result;
  }, [posts, selectedCategory, sortByNew, sortByPopular]);

  const isShuffling: boolean =
    sortByNew === null &&
    sortByPopular === null &&
    selectedCategory === null;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-2 items-center justify-between border-b pb-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.label}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.value ? null : cat.value
                )
              }
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortByNew ? "default" : "outline"}
            size="sm"
            className="w-24"
            onClick={() => {
              const next =
                sortByNew === "desc" ? "asc" : sortByNew === "asc" ? null : "desc";

              setSortByNew(next);
              if (next) setSortByPopular(null); 
            }}
          >
            Новизна
          </Button>

          <Button
            variant={sortByPopular ? "default" : "outline"}
            size="sm"
            className="w-24"
            onClick={() => {
              const next =
                sortByPopular === "desc"
                  ? "asc"
                  : sortByPopular === "asc"
                  ? null
                  : "desc";

              setSortByPopular(next);
              if (next) setSortByNew(null);
            }}
          >
            Популярність
          </Button>
        </div>
      </div>

      
      <PostGrid
        posts={filteredPosts}
        dbUserId={dbUserId}
        shuffle={isShuffling}
      />
    </div>
  );
}
