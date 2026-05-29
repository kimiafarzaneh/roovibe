import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { logout } from "@/services/apiAuth";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: logoutUser, isPending } = useMutation({
    mutationFn: logout,

    onSuccess: () => {
      // Wipe the entire React Query cache — removes user data and any
      // other cached queries that may contain user-specific data
      queryClient.clear();
      router.push("/");
    },
  });

  return { logoutUser, isPending };
}