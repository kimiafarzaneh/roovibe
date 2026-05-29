import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/apiAuth";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const { data: user, isLoading, error, isFetching } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: getCurrentUser,

    // staleTime: how long the cached data is considered fresh.
    // During this window React Query will NOT refetch even if the component
    // remounts or the window regains focus. 5 minutes is right for auth —
    // the Supabase JWT is valid for 1 hour so 5min stale is safe.
    staleTime: 1000 * 60 * 5,

    // gcTime (formerly cacheTime): how long to keep the data in memory
    // after all components using this query have unmounted.
    // 10 minutes means navigating away and back won't trigger a refetch.
    gcTime: 1000 * 60 * 10,

    // Don't retry auth failures — a 401 won't fix itself by retrying.
    retry: false,

    // Don't refetch when the window regains focus for auth —
    // this was the main cause of the "random logout" feeling.
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isFetching,
    error,
    isAuthenticated: !!user,
  };
}