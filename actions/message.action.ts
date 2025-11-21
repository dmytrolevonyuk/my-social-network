"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";


export async function startThread(toUserId: string, firstMessage?: string) {
  const me = await getDbUserId();
  if (!me) throw new Error("Unauthorized");
  if (me === toUserId) throw new Error("Cannot DM yourself");

  
  const existing = await prisma.dMThread.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: me } } },
        { participants: { some: { userId: toUserId } } },
      ],
    },
    include: { participants: true },
  });

  
  let threadId: string;
  if (existing && existing.participants.length === 2) {
    threadId = existing.id;
  } else {
    
    const created = await prisma.dMThread.create({ data: {} });
    threadId = created.id;

    await prisma.dMParticipant.createMany({
      data: [
        { threadId, userId: me, status: "ACCEPTED" },
        { threadId, userId: toUserId, status: "PENDING" }, 
      ],
    });
  }

  
  const text = firstMessage?.trim();
  if (text) {
    await prisma.dMMessage.create({
      data: { threadId, senderId: me, content: text },
    });
    await prisma.dMThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
  }

  revalidatePath("/messages");
  return threadId;
}


export async function getInbox() {
  const me = await getDbUserId();
  if (!me) return [];

  const threads = await prisma.dMThread.findMany({
    where: {
      participants: { some: { userId: me, status: "ACCEPTED" } },
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, username: true, image: true, name: true } } },
      },
      participants: {
        where: { userId: { not: me } },
        include: { user: { select: { id: true, username: true, image: true, name: true } } },
      },
    },
  });

  return threads;
}


export async function getRequests() {
  const me = await getDbUserId();
  if (!me) return [];
  const threads = await prisma.dMThread.findMany({
    where: { participants: { some: { userId: me, status: "PENDING" } } },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } },
      participants: {
        where: { userId: { not: me } },
        include: { user: { select: { id: true, username: true, image: true, name: true } } },
      },
    },
  });
  return threads;
}


export async function acceptRequest(threadId: string) {
  const me = await getDbUserId();
  if (!me) throw new Error("Unauthorized");
  await prisma.dMParticipant.updateMany({
    where: { threadId, userId: me },
    data: { status: "ACCEPTED" },
  });
  revalidatePath(`/messages/${threadId}`);
  revalidatePath(`/messages`);
}


export async function declineRequest(threadId: string) {
  const me = await getDbUserId();
  if (!me) throw new Error("Unauthorized");
  await prisma.dMParticipant.deleteMany({ where: { threadId, userId: me } });
  revalidatePath(`/messages`);
}


export async function getThread(threadId: string) {
  const me = await getDbUserId();
  if (!me) return null;

  const participant = await prisma.dMParticipant.findFirst({
    where: { threadId, userId: me },
  });
  if (!participant) throw new Error("Forbidden");

  const thread = await prisma.dMThread.findUnique({
    where: { id: threadId },
    include: {
      participants: { include: { user: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      
        include: { sender: { select: { id: true, username: true, image: true, name: true } } },
      },
    },
  });

 
  await prisma.dMParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return thread;
}


export async function sendMessage(threadId: string, content: string) {
  const me = await getDbUserId();
  if (!me) throw new Error("Unauthorized");
  const text = (content ?? "").trim();
  if (!text) return;

  const participant = await prisma.dMParticipant.findFirst({
    where: { threadId, userId: me, status: { in: ["ACCEPTED", "PENDING"] } },
  });
  if (!participant) throw new Error("Forbidden");

  await prisma.dMMessage.create({
    data: { threadId, senderId: me, content: text },
  });

  await prisma.dMThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
}


export type DMAttachment = {
  url: string;
  type: "image" | "video" | "pdf" | "other";
  name?: string;
};


export async function sendMessageWithAttachments(
  threadId: string,
  content: string,
  attachments: DMAttachment[] = []
) {
  const me = await getDbUserId();
  if (!me) throw new Error("Unauthorized");

  const text = (content ?? "").trim();
  if (!text && attachments.length === 0) return;

  const participant = await prisma.dMParticipant.findFirst({
    where: { threadId, userId: me, status: { in: ["ACCEPTED", "PENDING"] } },
    select: { id: true },
  });
  if (!participant) throw new Error("Forbidden");

  await prisma.dMMessage.create({
    data: {
      threadId,
      senderId: me,
      content: text,
      attachments: attachments.length ? (attachments as any) : undefined,
    },
  });

  await prisma.dMThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/messages");
}


export async function deleteMessage(messageId: string) {
  const me = await getDbUserId();
  if (!me) throw new Error("Unauthorized");

  const msg = await prisma.dMMessage.findUnique({
    where: { id: messageId },
    select: { id: true, senderId: true, threadId: true },
  });
  if (!msg) return { success: true };
  if (msg.senderId !== me) throw new Error("Forbidden");

  await prisma.dMMessage.delete({ where: { id: messageId } });

  
  const last = await prisma.dMMessage.findFirst({
    where: { threadId: msg.threadId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  await prisma.dMThread.update({
    where: { id: msg.threadId },
    data: { lastMessageAt: last?.createdAt ?? new Date() },
  });

  revalidatePath(`/messages/${msg.threadId}`);
  revalidatePath("/messages");
  return { success: true };
}
