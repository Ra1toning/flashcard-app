import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createStarterDeck } from "@/lib/starter-deck";
import { logEvent } from "@/lib/analytics";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "И-мэйл", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null;

      const normalizedEmail = credentials.email.trim().toLowerCase();

      const ip = getClientIp(req?.headers ?? {});
      const limit = rateLimit(`login:${ip}:${normalizedEmail}`, 8, 5 * 60 * 1000);
      if (!limit.success) {
        throw new Error("Хэт олон оролдлого. 5 минутын дараа дахин оролдоно уу.");
      }

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user?.password) return null;
      const passwordMatches = await bcrypt.compare(credentials.password, user.password);
      if (!passwordMatches) return null;

      const { password: _password, ...safeUser } = user;
      return safeUser;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: Role }).role ?? "USER";
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        await createStarterDeck(user.id);
      } catch (seedError) {
        console.error("Starter deck seed хийхэд алдаа:", seedError);
      }
      await logEvent(user.id, "signup", { method: "google" });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
