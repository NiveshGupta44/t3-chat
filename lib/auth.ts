import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";

export const auth = betterAuth({
    trustedOrigins: [
    "https://t3-chatbynivesh-iota.vercel.app",
    
  ],
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    
    baseURL: {
        allowedHosts: [
            "t3-chatbynivesh-iota.vercel.app",
            "*.vercel.app"
        ],
        fallback: process.env.BETTER_AUTH_URL || "https://t3-chatbynivesh-iota.vercel.app"
    },
    secret: process.env.BETTER_AUTH_SECRET,  
     

    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET! 
        }
    }
});