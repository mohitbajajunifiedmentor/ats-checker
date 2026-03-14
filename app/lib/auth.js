import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Student Portal",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "student@example.com",
        },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        if (!email) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({ data: { email, name: "Student" } });
        }
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

