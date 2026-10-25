"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

function userTooltip(user) {
  if (user?.email) {
    return user.email;
  }
  if (user?.name) {
    return user.name;
  }
  return "Аккаунт";
}

function avatarInitial(user) {
  const source = user?.email?.trim() || user?.name?.trim() || "";
  const letter = source[0];
  return letter ? letter.toUpperCase() : null;
}

function UserPlaceholderIcon() {
  return (
    <svg className="profile-avatar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileAvatar({ user }) {
  const title = userTooltip(user);
  const initial = avatarInitial(user);

  return (
    <div className="profile-avatar" title={title} aria-label={title}>
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="profile-avatar-img" src={user.image} alt="" referrerPolicy="no-referrer" />
      ) : initial ? (
        <span className="profile-avatar-initial" aria-hidden="true">
          {initial}
        </span>
      ) : (
        <UserPlaceholderIcon />
      )}
    </div>
  );
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
