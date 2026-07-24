"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import DevRouteWarmer from "@/components/DevRouteWarmer";
import PwaSetup from "@/components/PwaSetup";
import LearningReasonPrompt from "@/components/LearningReasonPrompt";

function SessionCacheGuard() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const prevUserId = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    const currentUserId = session?.user?.id ?? null;
    if (initialized.current && prevUserId.current !== currentUserId) {
      queryClient.clear();
    }
    prevUserId.current = currentUserId;
    initialized.current = true;
  }, [status, session?.user?.id, queryClient]);

  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 45_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SessionCacheGuard />
        <DevRouteWarmer />
        <PwaSetup />
        <LearningReasonPrompt />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
