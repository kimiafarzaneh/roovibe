"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react"; 
import { supabase } from "@/utils/supabase/client";

type Tag = {
  id: number;
  name: string;
};

type AuthMode = "signin" | "signup";

type FeedbackMessage = {
  text: string;
  type: "error" | "info"; 
} | null;

export function OnboardingWizard() {
  const t = useTranslations("Index");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage>(null); 
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  useEffect(() => {
    async function loadTags() {
      setTagsLoading(true); 
      const { data, error } = await supabase
        .from("tags")
        .select("id,name")
        .order("name");

      if (error) {
        console.error("Failed to load tags:", error);
      }
      setAvailableTags((data || []) as Tag[]);
      setTagsLoading(false); 
    }
    loadTags();
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNext = () => {
    if (step === 2) {
      localStorage.setItem("roovibe_interests", JSON.stringify(selectedTags));
    }
    setStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    router.push("/feed");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);


    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFeedback({ text: error.message, type: "error" });
      } else {
        router.push("/feed");
      }

    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log(
        "SIGNUP RESULT",
        JSON.stringify({ data, error }, null, 2)
      );
      
      if (error) {
        setFeedback({
          text: error.message,
          type: "error",
        });
      
      } else if (data.user === null && data.session === null) {
        console.log("DUPLICATE EMAIL DETECTED");
      
        setFeedback({
          text: t("authEmailTaken"),
          type: "error",
        });
      
      } else if (data.session) {
        router.push("/feed");
      
      } else {
        setFeedback({
          text: t("authCheckEmail"),
          type: "info",
        });
      }
      
      console.log("SIGNUP RESULT", { data, error });
      
      if (error) {
        setFeedback({
          text: error.message,
          type: "error",
        });
      } else if (!data.user && !data.session) {
        setFeedback({
          text: t("authEmailTaken"),
          type: "error",
        });
      } else if (data.session) {
        router.push("/feed");
      } else {
        setFeedback({
          text: t("authCheckEmail"),
          type: "info",
        });
      }

      if (error) {
        setFeedback({ text: error.message, type: "error" });
      } else if (data.session) {
        router.push("/feed");
      } else if (data.user && data.user.identities?.length === 0) {
        setFeedback({ text: t("authEmailTaken"), type: "error" });
      } else {
        setFeedback({ text: t("authCheckEmail"), type: "info" });
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 w-full max-w-md"
          >
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                RooVibe
              </h1>
              <p className="text-xl text-muted-foreground">{t("title")}</p>
            </div>
            <Button onClick={handleNext} size="lg" className="w-full">
              {t("continue")}
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 w-full max-w-md"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {t("interestsTitle")}
              </h2>
              <p className="text-muted-foreground">{t("interestsSubtitle")}</p>
            </div>

            {tagsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.name)}
                      className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary scale-105"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Button
                onClick={handleNext}
                size="lg"
                className="w-full"
                disabled={selectedTags.length === 0 || tagsLoading}
              >
                {t("interestsNext")}
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="w-full">
                {t("skip")}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 w-full max-w-md"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {t("authTitle")}
              </h2>
              <p className="text-muted-foreground">{t("authSubtitle")}</p>
            </div>

            <div className="flex rounded-lg border p-1 gap-1">
              <button
                onClick={() => { setAuthMode("signin"); setFeedback(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  authMode === "signin"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {t("authSignIn")}
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setFeedback(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  authMode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {t("authSignUp")}
              </button>
            </div>

            <div className="space-y-4 text-start">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("authEmail")}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("authPassword")}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : authMode === "signin" ? (
                    t("authSignIn")
                  ) : (
                    t("authSignUp")
                  )}
                </Button>

                {feedback && (
                  <p
                    className={`text-sm ${
                      feedback.type === "error"
                        ? "text-destructive"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {feedback.text}
                  </p>
                )}
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                type="button"
                className="w-full"
              >
                {t("authGoogle")}
              </Button>

              <Button onClick={handleSkip} variant="ghost" className="w-full">
                {t("skip")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}