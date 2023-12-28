import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "../../../../config/db";
import jwt from "jsonwebtoken";

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

      const client = await pool.connect();
      if (user) {
        // this is when the jwt is actually altered.
        // the else clause does not persist to middleware
        // anytime we signin again, this clause creates an entirely new token
        token.userId = user.id;
        // create new db user if doesn't exist

        // can this be done in a single query? I need the results of the userlook up no matter if an insert was done or not
        // did it with postgres version of "upsert"

        const { rows } = await client.query(
          "INSERT INTO users (external_provider_id, name, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (external_provider_id) DO UPDATE SET external_provider_id = $1 RETURNING id, role;",
          [user.id, user.name, user.email, UserRoles.USER]
        );
        console.log("ROW", rows);
        if (rows.length === 1) {
          token.role = rows[0].role;
          token.dbId = rows[0].id;
        }
      } else {
        // check db role
        console.log("====IN THE ELSE CLAUSE====");
        const roleQuery =
          "SELECT role FROM users WHERE id = $1 OR external_provider_id = $2;";
        const { rows } = await client.query(roleQuery, [
          token.dbId,
          token.userId,
        ]);
        console.log("====ROWS RESULTS====");
        console.log(rows);
        token.role = rows[0].role;
      }
      console.log("TOKEN", token);
      client.release();
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId;
      session.role = token.role;
      return session;
    },
  },
  // jwt: {
  //   async encode({secret, token}) {
  //     token.
  //     return jwt.sign(token, secret)
  //   }
  // }
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
