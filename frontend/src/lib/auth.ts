export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  mustChangePassword: boolean | number;
  roleId: number;
  role: string;
  roleLabel: string;
  permissions: string[];
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/auth/me", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<boolean> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch (err) {
    console.error("Logout error", err);
  }
  return true;
}