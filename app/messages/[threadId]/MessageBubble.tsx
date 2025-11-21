"use client";

import { useState, useTransition, useRef } from "react";
import { deleteMessage } from "@/actions/message.action";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MessageBubble({
  id,
  mine,
  content,
  attachments,
}: {
  id: string;
  mine: boolean;
  content: string;
  attachments?: Array<{ url: string; type: string; name?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [isDel, startDel] = useTransition();

  const pressTimer = useRef<number | null>(null);
  const startPress = () => {
    if (!mine) return;
    clearPress();
    pressTimer.current = window.setTimeout(() => setOpen(true), 500);
  };
  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const confirmDelete = () => {
    startDel(async () => {
      try {
        await deleteMessage(id);
        setOpen(false);
      } catch {
        toast.error("Не вдалося видалити повідомлення");
      }
    });
  };

  const bubble = (
    <div
      className={`rounded-2xl px-3 py-2 max-w-[75%] ${
        mine ? "bg-primary text-primary-foreground" : "bg-muted"
      } ${mine ? "cursor-pointer" : ""}`}
      onDoubleClick={() => mine && setOpen(true)}
      onPointerDown={startPress}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
    >
      {content && <div className="whitespace-pre-wrap break-words">{content}</div>}

      {attachments && attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachments.map((a, i) => {
            if (a.type === "image") {
              return (
                <img
                  key={i}
                  src={a.url}
                  alt={a.name ?? "image"}
                  className="rounded-lg max-h-64 object-cover"
                />
              );
            }
            if (a.type === "video") {
              return <video key={i} src={a.url} controls className="rounded-lg max-h-64" />;
            }
            if (a.type === "pdf") {
              return (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="underline">
                  PDF: {a.name ?? a.url}
                </a>
              );
            }
            return (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="underline">
                Файл: {a.name ?? a.url}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative flex ${mine ? "justify-end" : "justify-start"}`}>
      {bubble}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити повідомлення?</AlertDialogTitle>
            <AlertDialogDescription>
              Це дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDel}>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDel}>
              Так, видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
