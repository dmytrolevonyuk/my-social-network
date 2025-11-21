"use client";
import { useEffect } from "react";

export default function SyncUserClient() {
  useEffect(() => {
    fetch("/api/sync-user");
  }, []);

  return null;
}
