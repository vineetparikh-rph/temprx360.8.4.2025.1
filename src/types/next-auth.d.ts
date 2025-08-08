import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      pharmacies: any[]
      mustChangePassword: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    pharmacies: any[]
    mustChangePassword: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    pharmacies: any[]
    mustChangePassword: boolean
  }
}
