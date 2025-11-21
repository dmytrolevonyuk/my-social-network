"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as RadixPopover from "@radix-ui/react-popover";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { PaperclipIcon, SmileIcon, SendIcon } from "lucide-react";
import toast from "react-hot-toast";
import {
  sendMessageWithAttachments,
  type DMAttachment,
} from "@/actions/message.action";

async function uploadToStorage(files: File[]): Promise<DMAttachment[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload_failed");
  const json = await res.json();
  return (json.attachments || []) as DMAttachment[];
}

export default function MessageComposer({ threadId }: { threadId: string }) {
  const [text, setText] = useState("");
  const [isSending, startSend] = useTransition();
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleEmojiSelect = (emoji: any) => {
    const symbol = emoji?.native ?? "";
    if (!symbol) return;
    if (!inputRef.current) {
      setText((t) => t + symbol);
      return;
    }
    const el = inputRef.current;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const updated = text.slice(0, start) + symbol + text.slice(end);
    setText(updated);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + symbol.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const openPicker = () => fileInputRef.current?.click();

  const onFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const uploaded = await uploadToStorage(files);
      if (!uploaded.length) {
        toast.error("Не вдалося завантажити файл(и)");
        e.target.value = "";
        return;
      }
      await sendMessageWithAttachments(threadId, text.trim(), uploaded);
      setText("");                
      e.target.value = "";
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      toast.error("Помилка під час надсилання");
    }
  };

  const onSend = () => {
    startSend(async () => {
      try {
        const body = text.trim();
        if (!body) return;
        await sendMessageWithAttachments(threadId, body, []);
        setText("");
        requestAnimationFrame(() => inputRef.current?.focus());
      } catch {
        toast.error("Не вдалося надіслати");
      }
    });
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center gap-2">
      
        <RadixPopover.Root open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
          <RadixPopover.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label="emoji">
              <SmileIcon className="w-5 h-5" />
            </Button>
          </RadixPopover.Trigger>
          <RadixPopover.Portal>
            <RadixPopover.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-[9999] pointer-events-auto rounded-xl border bg-background p-0 shadow-md outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="auto"
                previewPosition="none"
                skinTonePosition="search"
              />
            </RadixPopover.Content>
          </RadixPopover.Portal>
        </RadixPopover.Root>

    
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept="image/*,video/*,.pdf"
          onChange={onFilesChosen}
        />
        <Button variant="ghost" size="icon" onClick={openPicker} aria-label="attach">
          <PaperclipIcon className="w-5 h-5" />
        </Button>

        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишіть повідомлення…"
          autoComplete="off"
          className="h-11"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <Button onClick={onSend} disabled={isSending || !text.trim()} className="h-11">
          <SendIcon className="w-4 h-4 mr-2" />
          Надіслати
        </Button>
      </div>
    </div>
  );
}
