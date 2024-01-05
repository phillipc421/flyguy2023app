import { JWT } from "next-auth/jwt";

export interface FlyGuyJWT extends JWT {
  userId: string;
  role: string;
  dbId: string;
  stripeUser: string;
}
