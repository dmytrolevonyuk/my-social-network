import { LayoutDashboardIcon, BellRingIcon, SmileIcon, SendIcon  } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";
import { currentUser } from "@clerk/nextjs/server";

async function DesktopNavbar() {
  const user = await currentUser();

  return (
    <div className="hidden md:flex items-center space-x-4">
      <ModeToggle />

      
      <Button variant="ghost" className="flex items-center gap-2" asChild>
        <Link href="/">
          <LayoutDashboardIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Головна</span>
        </Link>
      </Button>

      {user ? (
        <>
        
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link href="/notifications">
              <BellRingIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Сповіщення</span>
            </Link>
          </Button>


    <Button variant="ghost" className="flex items-center gap-2" asChild>
      <Link href="/messages">
        <SendIcon className="w-4 h-4" />
        <span className="hidden lg:inline">Повідомлення</span>
      </Link>
    </Button>

          
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link
              href={`/profile/${
                user.username ??
                user.emailAddresses[0].emailAddress.split("@")[0]
              }`}
            >
              <SmileIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Профіль</span>
            </Link>
          </Button>

          <UserButton />
        </>
      ) : (
        <SignInButton mode="modal">
          <Button variant="default">Зареєструватися</Button>
        </SignInButton>
      )}
    </div>
  );
}

export default DesktopNavbar;
