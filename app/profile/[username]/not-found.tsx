import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeIcon, ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <p className="text-8xl font-bold text-primary font-mono">404</p>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Користувача не знайдено</h1>
              <p className="text-muted-foreground">Користувача, якого ви шукаєте, не існує</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="default" asChild>
                <Link href="/">
                  <HomeIcon className="mr-2 size-4" />
                  Головна
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeftIcon className="mr-2 size-4" />
                    Попередня сторінка
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
