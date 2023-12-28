import { NextResponse } from "next/server";
import { NextAuthOptions, Session, getServerSession } from "next-auth";

interface CustomSession extends Session {
  role: "admin" | "user";
}

export class AuthService {
  private session!: CustomSession | null;
  constructor(private authOptions: NextAuthOptions) {
    this.authOptions = authOptions;
  }

  private async fetchSession() {
    this.session = await getServerSession(this.authOptions);
  }

  public async isLoggedIn() {
    await this.fetchSession();
    if (!this.session) {
      return false;
    }
    return true;
  }

  public async isAdmin() {
    await this.fetchSession();
    if (this.session) {
      return this.session.role === "admin" ? true : false;
    }
    // throw new Error("No session data");
    return false;
  }
}
