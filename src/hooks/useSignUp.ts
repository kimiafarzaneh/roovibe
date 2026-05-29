import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { signup } from "@/services/apiAuth";
import type { SignUpCredentials } from "@/services/apiAuth";

export function useSignUp() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    mutate: signUpUser,
    isPending,
    // ✅ error here is the Error object thrown from apiAuth.ts signup()
    // This includes our custom "An account with this email already exists." message
    error,
    data,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: (credentials: SignUpCredentials) => signup(credentials),

    onSuccess: (data) => {
      if (data.session) {
        // Email confirmation OFF — logged in immediately
        queryClient.setQueryData(["user"], data.user);
        router.push("/feed");
      }
      // If session is null, email confirmation is ON.
      // Component reads isSuccess + !data.session to show green message.
    },
    // No onError needed — the error object is returned directly
    // and the component reads it from the hook return value
  });

  return {
    signUpUser,
    isPending,
    error,      // Error | null — .message has the human-readable text
    data,
    isError,
    isSuccess,
  };
}