import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { isCloudAuthConfigured, isGoogleAuthReady } from "@/lib/auth/config";
import { findUserByEmail, upsertOAuthUser } from "@/lib/turso/users";

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
    async jwt({ token, user, account, profile }) {
      if (user?.id) {
        token.sub = user.id;
        return token;
      }
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await findUserByEmail(profile.email);
        if (dbUser) {
          token.sub = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
