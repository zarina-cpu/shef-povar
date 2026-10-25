"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function AuthBar({ onAuthChange }) {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    onAuthChange?.(session?.user ?? null);
  }, [status, session?.user?.id, session?.user?.email, session?.user?.image, onAuthChange]);

  if (status === "loading") {
    return null;
  }

  if (!user) {
    return (
      <div className="header-profile">
        <Link className="auth-link auth-link-primary" href="/login">
          Войти
        </Link>
        <ThemeToggle compact />
      </div>
    );
  }

  return (
    <div className="header-profile">
      <div className="profile-row">
        <ProfileAvatar user={user} />
        <button
          className="auth-link profile-signout"
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Выйти
        </button>
      </div>
      <ThemeToggle compact />
    </div>
  );
}
