import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCurrentUser } from "@/services/apiAuth";
import type { UpdateUserPayload } from "@/services/apiAuth";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  const { mutate: updateUser, isPending, error } = useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateCurrentUser(payload),

    onSuccess: (data) => {
      // After updating, refresh the cached user so every component
      // that calls useUser() sees the new fullName / avatar immediately
      queryClient.setQueryData(["user"], data?.user);
    },

    onError: (err: Error) => {
      console.error("Update failed:", err.message);
    },
  });

  return { updateUser, isPending, error };
}