import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "../../../../config/db";

enum UserRoles {
  USER = "user",
  ADMIN = "admin",
}

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // alter the JWT to include the user's external id (provider id) and user role from DB
    async jwt({ token, account, profile, user }) {
      const client = await pool.connect();
      if (user) {
        // this is when the jwt is actually altered.
        // the else clause does not persist to middleware
        // anytime we signin again, this clause creates an entirely new token
        token.userId = user.id;
        // create new db user if doesn't exist
        const { rows } = await client.query(
          "INSERT INTO users (external_provider_id, name, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (external_provider_id) DO UPDATE SET external_provider_id = $1 RETURNING id, role;",
          [user.id, user.name, user.email, UserRoles.USER]
        );

        if (rows.length === 1) {
          token.role = rows[0].role;
          token.dbId = rows[0].id;
        }
      } else {
        // check db role
        const roleQuery =
          "SELECT role FROM users WHERE id = $1 OR external_provider_id = $2;";
        const { rows } = await client.query(roleQuery, [
          token.dbId,
          token.userId,
        ]);
        token.role = rows[0].role;
      }
      client.release();
      return token;
    },

    // persist the role and userId values to the client session
    async session({ session, token }) {
      Object.assign(session, {
        role: token.role,
        user: { ...session.user, id: token.userId },
      });
      return session;
    },
  },
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
