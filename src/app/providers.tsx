"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RestaurantProvider } from "@/context/RestaurantContext";
import AppLayout from "@/components/AppLayout";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create the QueryClient once per browser session.
  const [queryClient] = useState(() => new QueryClient());

  // This app is fully client-side (localStorage, audio, etc.). Gate rendering
  // until mounted so server output matches the first client render and there
  // is no hydration mismatch from reading localStorage during initialization.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <RestaurantProvider>
          <AppLayout>{children}</AppLayout>
        </RestaurantProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
