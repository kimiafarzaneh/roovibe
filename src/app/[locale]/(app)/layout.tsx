import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Home, Search, PlusCircle, User } from "lucide-react";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("Navigation");

  return (
    <div className="flex-1 flex flex-col relative pb-16">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-t flex items-center justify-around z-50">
        <Link href="/feed" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t("home")}</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t("explore")}</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t("create")}</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t("profile")}</span>
        </Link>
      </nav>
    </div>
  );
}
