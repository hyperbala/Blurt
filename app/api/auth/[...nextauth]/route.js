// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { connectToDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // Modify the jwt callback in your authOptions
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account) {
        try {
          await connectToDB();
          const existingUser = await User.findOne({ email: token.email });

          if (existingUser) {
            token.userId = existingUser._id.toString();
            token.hasCompletedOnboarding = existingUser.hasCompletedOnboarding;
          } else {
            const newUser = await User.create({
              email: token.email,
              name: token.name,
              image: token.picture,
              googleId: account.providerAccountId,
              hasCompletedOnboarding: false,
            });
            token.userId = newUser._id.toString();
            token.hasCompletedOnboarding = false;
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
        }
      }

      // Handle session updates
      if (trigger === "update") {
        return { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.hasCompletedOnboarding = token.hasCompletedOnboarding;

        try {
          await connectToDB();
          const user = await User.findById(token.userId);
          if (user) {
            session.user.username = user.username;
            session.user.name = user.name;
            session.user.hasCompletedOnboarding = user.hasCompletedOnboarding;
          }
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      return session;
    },

    async redirect({ url, baseUrl, token }) {
      // Only redirect to username-select if explicitly not completed onboarding
      if (url.startsWith(baseUrl)) {
        if (token?.hasCompletedOnboarding === false) {
          return `${baseUrl}/auth/username-select`;
        }
        return url; // Return the original URL if hasCompletedOnboarding is true or undefined
      }
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/username-select'
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };