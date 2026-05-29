import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { login } from "@/services/apiAuth";
import type { LoginCredentials } from "@/services/apiAuth";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: loginUser, isPending, error } = useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      login({ email, password }),

    onSuccess: (data) => {
      // Manually populate the React Query cache with the user we just got back.
      // This means useUser() everywhere will immediately have the user
      // without needing to make another network call.
      queryClient.setQueryData(["user"], data.user);
      router.push("/feed");
    },

    onError: (err: Error) => {
      // Error is available via the returned `error` object below,
      // but you can also add toast notifications here later
      console.error("Login failed:", err.message);
    },
  });

  return {
    loginUser,
    isPending,  // use this for your loading spinner
    error,      // Error | null — pass error.message to your UI
  };
}