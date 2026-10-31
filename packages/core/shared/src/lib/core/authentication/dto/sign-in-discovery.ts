import { z } from 'zod'

export const DiscoverSignInMethodsRequest = z.object({
    domain: z.string().min(1).max(253),
})

export type DiscoverSignInMethodsRequest = z.infer<typeof DiscoverSignInMethodsRequest>

export const SignInMethods = z.object({
    email: z.boolean(),
    google: z.boolean(),
    sso: z.boolean(),
})

export type SignInMethods = z.infer<typeof SignInMethods>

export const DiscoverSignInMethodsResponse = z.discriminatedUnion('domainOwned', [
    z.object({ domainOwned: z.literal(true), methods: SignInMethods }),
    z.object({ domainOwned: z.literal(false) }),
])

export type DiscoverSignInMethodsResponse = z.infer<typeof DiscoverSignInMethodsResponse>
