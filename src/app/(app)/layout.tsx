import AppLayout from "@/components/AppLayout";

// Layout for all authenticated app routes. Middleware ensures the user is
// signed in before any of these render; this just adds the sidebar shell.
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
