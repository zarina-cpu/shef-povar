import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import {
  isCloudAuthConfigured,
  isGoogleAuthReady,
} from "@/lib/auth/config";

export const metadata = {
  title: "Вход — Шеф из того, что есть дома",
};

export default function LoginPage() {
  return (
    <main className="app">
      <header className="header">
        <div className="header-actions">
          <ThemeToggle />
        </div>
        <div className="brand">
          <h1>Вход</h1>
          <p>
            Google или email — рецепты в Turso и синхронизация на Vercel между телефоном,
            планшетом и компьютером.
          </p>
        </div>
      </header>

      <LoginForm
        cloudReady={isCloudAuthConfigured()}
        googleReady={isGoogleAuthReady()}
      />

      <p className="auth-back">
        <Link href="/">← На главную</Link>
      </p>
    </main>
  );
}
