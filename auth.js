import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { isCloudAuthConfigured, isGoogleAuthReady } from "@/lib/auth/config";
import { findUserByEmail, findUserById, upsertOAuthUser } from "@/lib/turso/users";

/** Фото только в Turso + GET /api/profile/avatar — never in JWT (494 on Vercel) */
function stripHeavyJwtFields(token) {
  delete token.picture;
  delete token.image;
  return token;
}

function httpAvatarOnly(image) {
  if (typeof image !== "string" || !image.startsWith("http")) {
    return null;
  }
  return image.length <= 512 ? image : null;
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
  cookies: {
    sessionToken: {
      name: "shef-povar.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
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
      stripHeavyJwtFields(token);

      if (trigger === "update") {
        token.avatarRev = (token.avatarRev || 0) + 1;
        return token;
      }
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await findUserByEmail(profile.email);
        if (dbUser) {
          token.sub = dbUser.id;
        }
        if (profile.name) {
          token.name = profile.name;
        }
        if (profile.email) {
          token.email = profile.email;
        }
        return token;
      }
      if (user?.id) {
        token.sub = user.id;
      }
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      session.user.image = null;
      if (session.user && token.sub) {
        const dbUser = await findUserById(token.sub);
        const avatar = httpAvatarOnly(dbUser?.image);
        if (avatar) {
          session.user.image = avatar;
        }
      }
      return session;
    },
  },
});
