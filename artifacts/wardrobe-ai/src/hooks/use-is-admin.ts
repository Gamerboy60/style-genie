import { useUser } from "@clerk/react";

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID as string | undefined;

export function useIsAdmin(): boolean {
  const { user } = useUser();
  if (!ADMIN_USER_ID || !user) return false;
  return user.id === ADMIN_USER_ID;
}
