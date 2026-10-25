"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

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

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

function compressImageFile(file, maxSide = 1200, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Не удалось обработать фото."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось открыть фото."));
    };
    img.src = url;
  });
}

async function prepareAvatarUpload(file) {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Фото должно быть не больше 8 МБ.");
  }
  let dataUrl = await compressImageFile(file);
  let approxBytes = Math.ceil(String(dataUrl).length * 0.75);
  if (approxBytes <= MAX_AVATAR_BYTES) {
    return dataUrl;
  }
  dataUrl = await compressImageFile(file, 900, 0.82);
  approxBytes = Math.ceil(String(dataUrl).length * 0.75);
  if (approxBytes <= MAX_AVATAR_BYTES) {
    return dataUrl;
  }
  dataUrl = await compressImageFile(file, 640, 0.75);
  approxBytes = Math.ceil(String(dataUrl).length * 0.75);
  if (approxBytes > MAX_AVATAR_BYTES) {
    throw new Error("Не удалось уложить фото в 8 МБ. Попробуйте другое изображение.");
  }
  return dataUrl;
}

export default function ProfileAvatar({ user }) {
  const { update } = useSession();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [storedAvatar, setStoredAvatar] = useState(null);

  const title = userTooltip(user);
  const initial = avatarInitial(user);
  const oauthAvatar =
    user?.image && String(user.image).startsWith("http") ? user.image : null;
  const imageSrc = preview || storedAvatar || oauthAvatar;

  useEffect(() => {
    setPreview(null);
    setStoredAvatar(null);
    if (!user?.id) {
      return;
    }
    let cancelled = false;
    fetch("/api/profile/avatar", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.image) {
          setStoredAvatar(data.image);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!/^image\//.test(file.type)) {
      window.alert("Выберите изображение (JPG, PNG или WebP).");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await prepareAvatarUpload(file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Не удалось загрузить фото.");
      }
      setPreview(data.image);
      setStoredAvatar(data.image);
      await update();
    } catch (err) {
      window.alert(err?.message || "Не удалось загрузить фото.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="profile-avatar-input"
        onChange={onFileChange}
      />
      <button
        type="button"
        className="profile-avatar profile-avatar-btn"
        title={`${title}. Нажмите, чтобы загрузить фото.`}
        aria-label="Загрузить фото профиля"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="profile-avatar-img" src={imageSrc} alt="" referrerPolicy="no-referrer" />
        ) : initial ? (
          <span className="profile-avatar-initial" aria-hidden="true">
            {initial}
          </span>
        ) : (
          <UserPlaceholderIcon />
        )}
      </button>
    </>
  );
}
