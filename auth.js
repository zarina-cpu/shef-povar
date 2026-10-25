import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { isCloudAuthConfigured, isGoogleAuthReady } from "@/lib/auth/config";
import { findUserByEmail, upsertOAuthUser } from "@/lib/turso/users";

/** В JWT-cookie нельзя класть base64 — иначе 494 REQUEST_HEADER_TOO_LARGE на Vercel */
function pictureForJwtCookie(image) {
  if (typeof image !== "string" || !image) {
    return undefined;
  }
  if (image.startsWith("data:") || image.length > 480) {
    return undefined;
  }
  return image;
}

function sanitizeTokenPicture(token) {
  if (typeof token.picture === "string") {
    const safe = pictureForJwtCookie(token.picture);
    if (safe) {
      token.picture = safe;
    } else {
      delete token.picture;
    }
  }
  return token;
}

const providers = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!isCloudAuthConfigured()) {
        return null;
      }
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      if (!email || !password) {
        return null;
      }
      const user = await findUserByEmail(email);
      if (!user?.password_hash) {
        return null;
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return null;
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (isGoogleAuthReady()) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (!isCloudAuthConfigured()) {
        return false;
      }
      if (account?.provider === "google" && profile?.email) {
        await upsertOAuthUser({
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        });
      }
      return true;
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (trigger === "update") {
        token.avatarRev = (token.avatarRev || 0) + 1;
        return sanitizeTokenPicture(token);
      }
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await findUserByEmail(profile.email);
        if (dbUser) {
          token.sub = dbUser.id;
          const fromDb = pictureForJwtCookie(dbUser.image);
          if (fromDb) {
            token.picture = fromDb;
          }
        }
        if (!token.picture && profile.picture) {
          token.picture = pictureForJwtCookie(profile.picture);
        }
        if (profile.name) {
          token.name = profile.name;
        }
        return sanitizeTokenPicture(token);
      }
      if (user?.id) {
        token.sub = user.id;
      }
      const fromUser = pictureForJwtCookie(user?.image);
      if (fromUser) {
        token.picture = fromUser;
      }
      return sanitizeTokenPicture(token);
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user) {
        const safe = pictureForJwtCookie(token.picture);
        session.user.image = safe || null;
      }
      return session;
    },
  },
});
