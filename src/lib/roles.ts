// Shared role definitions and access rules. Pure data/logic so it can be
// imported by both the edge proxy and client components.

export const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "cashier", label: "Cashier" },
  { value: "server", label: "Server" },
  { value: "kitchen", label: "Kitchen Staff" },
] as const;

export type Role = (typeof ROLES)[number]["value"];

export const ALL_ROLES: Role[] = ROLES.map((r) => r.value);

// Only these routes are restricted (Owner-only). Everything else is open to
// every signed-in role.
const ACCESS: Record<string, Role[]> = {
  "/statistics": ["owner"],
  "/expenses": ["owner"],
  "/settings": ["owner"],
};

export function rolesForPath(pathname: string): Role[] | null {
  if (ACCESS[pathname]) return ACCESS[pathname]; // exact match
  const key = Object.keys(ACCESS).find((k) => pathname.startsWith(k + "/"));
  return key ? ACCESS[key] : null; // null = unrestricted route
}

export function canAccess(role: Role | undefined, pathname: string): boolean {
  const allowed = rolesForPath(pathname);
  if (!allowed) return true; // unrestricted -> everyone
  return allowed.includes((role ?? "owner") as Role); // legacy/no-role -> owner
}

// Where to send a role on login / when access is denied.
export function defaultPathForRole(role: Role | undefined): string {
  switch (role) {
    case "kitchen":
      return "/kitchen";
    case "cashier":
      return "/counter";
    default:
      return "/"; // owner, server, or unknown
  }
}
