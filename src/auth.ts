import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.userId = (profile as any).id?.toString?.() || token.sub;
        token.login = (profile as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId || token.sub;
        (session.user as any).login = token.login;
      }
      return session;
    },
  },
  trustHost: true,
});
