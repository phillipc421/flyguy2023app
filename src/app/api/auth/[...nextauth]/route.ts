import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "../../../../config/db";

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      console.log("===JWT CALLBACK===");
      console.log("+++TOKEN+++");
      console.log(token);
      console.log("+++ACCOUNT+++");
      console.log(account);
      console.log("+++PROFILE+++");
      console.log(profile);
      console.log("+++USER+++");
      console.log(user);
      console.log("===JWT CALLBACK END===");

      if (user) {
        token.userId = user.id;
        // create new db user if doesn't exist
        const client = await pool.connect();
        await client.query(
          "INSERT INTO users (external_provider_id, name, email) VALUES ($1, $2, $3) ON CONFLICT (external_provider_id) DO NOTHING;",
          [user.id, user.name, user.email]
        );
        client.release();
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId;
      return session;
    },
  },
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
