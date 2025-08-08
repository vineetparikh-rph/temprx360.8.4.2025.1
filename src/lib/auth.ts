import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              userPharmacies: {
                include: { pharmacy: true }
              }
            }
          })

          if (!user || !user.hashedPassword) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword)
          if (!isPasswordValid) {
            return null
          }

          // Format pharmacies for session
          const pharmacies = user.userPharmacies.map(up => ({
            id: up.pharmacy.id,
            name: up.pharmacy.name,
            code: up.pharmacy.code
          }))

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pharmacies: pharmacies,
            mustChangePassword: false // Default to false since field doesn't exist in schema
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.pharmacies = user.pharmacies
        token.mustChangePassword = user.mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.pharmacies = token.pharmacies as any[]
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
  }
}

// NextAuth v4 export
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// For server-side usage
export { authOptions as auth }