"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

function userLabel(user) {
  if (user?.email) {
    return user.email;
  }
  if (user?.name) {
    return user.name;
  }
  return "Аккаунт";
}

export default function AuthBar({ onAuthChange }) {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    onAuthChange?.(session?.user ?? null);
  }, [status, session?.user?.id, session?.user?.email, onAuthChange]);

  if (status === "loading") {
    return null;
  }

  if (!user) {
    return (
      <Link className="auth-link auth-link-primary" href="/login">
        Войти
      </Link>
    );
  }

  return (
    <div className="auth-bar">
      <span className="auth-user" title={userLabel(user)}>
        {userLabel(user)}
      </span>
      <button className="auth-link" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
        Выйти
      </button>
    </div>
  );
}
