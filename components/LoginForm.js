"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginForm({ cloudReady, googleReady }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  async function signInWithEmail(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Неверный email или пароль.");
      return;
    }
    window.location.href = "/";
  }

  async function signUpWithEmail(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Не удалось зарегистрироваться.");
        setLoading(false);
        return;
      }
      setMessage("Аккаунт создан. Сейчас выполним вход…");
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setError("Аккаунт создан, но вход не удался. Попробуйте войти вручную.");
        return;
      }
      window.location.href = "/";
    } catch {
      setLoading(false);
      setError("Не удалось связаться с сервером.");
    }
  }

  if (!cloudReady) {
    return (
      <div className="auth-panel">
        <p className="status error">
          Облако (Turso + Vercel) не настроено. Добавьте переменные из{" "}
          <code>.env.local.example</code> и выполните SQL из{" "}
          <code>turso/schema.sql</code> в базе Turso.
        </p>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      {googleReady ? (
        <button
          className="auth-google"
          type="button"
          disabled={loading}
          onClick={signInWithGoogle}
        >
          Войти через Google
        </button>
      ) : (
        <p className="status">
          Google OAuth: добавьте AUTH_GOOGLE_ID и AUTH_GOOGLE_SECRET (Vercel / Google Cloud Console).
        </p>
      )}

      <form className="auth-form" onSubmit={signInWithEmail}>
        <label className="field">
          <span>Email</span>
          <input
            className="extra-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            className="extra-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button className="submit" type="submit" disabled={loading}>
          Войти
        </button>
        <button
          className="auth-secondary"
          type="button"
          disabled={loading}
          onClick={signUpWithEmail}
        >
          Создать аккаунт
        </button>
      </form>

      {message ? <p className="status">{message}</p> : null}
      {error ? <p className="status error">{error}</p> : null}
    </div>
  );
}
