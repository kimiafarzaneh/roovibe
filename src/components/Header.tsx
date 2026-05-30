"use client";

import { useUser } from "@/hooks/useUser";
import { useLogout } from "@/hooks/useLogout";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function Header() {
  const { isAuthenticated, isLoading } = useUser();
  const { logoutUser, isPending } = useLogout();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo — just the app name, clean and bold */}
        <Link href="/feed" className="text-xl font-bold tracking-tight">
          RooVibe
        </Link>

        {/* Right side nav */}
        {/* <nav className="flex items-center gap-2">
          {isLoading ? (
            // Don't flash buttons while we're checking auth status
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" >
                <Link href="/profile">Profile</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutUser()}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Sign out"
                )}
              </Button>
            </>
          ) : (
            <Button size="sm" >
              <Link href="/">Sign in</Link>
            </Button>
          )}
        </nav> */}
      </div>
    </header>
  );
}