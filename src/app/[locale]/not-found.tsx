import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-5xl font-bold tracking-tight">404</p>
          <h1 className="text-2xl font-bold tracking-tight">
            This vibe doesn't exist
          </h1>
          <p className="text-muted-foreground text-sm">
            The page you're looking for has moved or never existed.
          </p>
        </div>

        <Button >
          <Link href="/feed">Back to feed</Link>
        </Button>
      </div>
    </div>
  );
}