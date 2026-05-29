"use client";

import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export function LogoutButton() {
  const { logoutUser, isPending } = useLogout();

  return (
    <Button
      variant="destructive"
      onClick={() => logoutUser()}
      disabled={isPending}
      className="w-full sm:w-auto"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}