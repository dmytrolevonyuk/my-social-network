'use client';

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

export function SidebarClientButtons() {
  return (
    <>
      <SignInButton mode="modal">
        <Button className="w-full" variant="outline">
          Увійти
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="w-full mt-2" variant="default">
          Зареєструватися
        </Button>
      </SignUpButton>
    </>
  );
}
