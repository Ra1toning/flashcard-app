import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStarterDeck } from "@/lib/starter-deck";
import { logEvent } from "@/lib/analytics";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const adapter = PrismaAdapter(prisma);

export const authOptions: NextAuthOptions = {
  adapter,
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const email = profile.email.toLowerCase();
        const alreadyLinked = await prisma.account.findUnique({
          where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
        });
        if (!alreadyLinked) {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser?.emailVerified) {
            await adapter.linkAccount!({ ...account, userId: existingUser.id });
          }
        }
      }
      return true;
    },
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
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }).catch(() => undefined);
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
