import { createClerkClient, verifyToken } from '@clerk/backend'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { JwtSignAlgorithm, jwtUtils } from '../../helper/jwt-utils'
import { managedAuthnService } from '../managed-authn/managed-authn-service'

// In-memory rate limit: 10 SSO exchanges per userId per 60s.
const RL_WINDOW_MS = 60_000
const RL_MAX = 10
const rlStore = new Map<string, number[]>()

function checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const prev = (rlStore.get(userId) ?? []).filter(t => now - t < RL_WINDOW_MS)
    if (prev.length >= RL_MAX) return false
    rlStore.set(userId, [...prev, now])
    return true
}

function parseCookies(header: string | undefined): Record<string, string> {
    if (!header) return {}
    return Object.fromEntries(
        header.split(';').map(c => {
            const [k, ...v] = c.trim().split('=')
            return [k.trim(), decodeURIComponent(v.join('='))]
        }),
    )
}

export const apSsoController: FastifyPluginAsyncZod = async (app) => {
    // GET /api/ap-sso — called by Clerk after sign-in (forceRedirectUrl="/api/ap-sso")
    // Reads the Clerk __session cookie, verifies it, signs an AP external JWT,
    // exchanges it for an AP session, and redirects to /authenticate.
    app.get(
        '/',
        {
            config: { security: securityAccess.public() },
            schema: {},
        },
        async (req, reply) => {
            const clerkSecretKey = process.env.CLERK_SECRET_KEY
            const signingKeyId = process.env.AP_SIGNING_KEY_ID
            const privateKeyPem = (process.env.AP_SIGNING_KEY_PRIVATE ?? '').replace(/\\n/g, '\n')

            if (!clerkSecretKey || !signingKeyId || !privateKeyPem) {
                req.log.error('[ap-sso] Missing env: CLERK_SECRET_KEY, AP_SIGNING_KEY_ID, AP_SIGNING_KEY_PRIVATE')
                const siteUrl = process.env.VITE_OTOM8_SITE_URL ?? ''
                return reply.redirect(`${siteUrl}/login?error=config`)
            }

            // Accept bearer token (server-to-server from Next.js) or __session cookie.
            // The Next.js route calls auth().getToken() which is always fresh, so
            // the bearer path is immune to stale-cookie loops.
            const authHeader = req.headers.authorization
            const sessionToken = authHeader?.startsWith('Bearer ')
                ? authHeader.slice(7)
                : parseCookies(req.headers.cookie)['__session']

            if (!sessionToken) {
                const siteUrl = process.env.VITE_OTOM8_SITE_URL ?? ''
                return reply.redirect(`${siteUrl}/login?signed_out=1`)
            }

            // Verify Clerk session JWT — fetches Clerk JWKS, caches them.
            let userId: string
            let orgId: string | undefined
            try {
                const payload = await verifyToken(sessionToken, { secretKey: clerkSecretKey })
                userId = payload.sub
                orgId = (payload as Record<string, unknown>).org_id as string | undefined
            }
            catch (err) {
                req.log.warn({ err }, '[ap-sso] Clerk session verification failed, redirecting to login')
                const siteUrl = process.env.VITE_OTOM8_SITE_URL ?? ''
                return reply.redirect(`${siteUrl}/login?signed_out=1`)
            }

            if (!checkRateLimit(userId)) {
                return reply.status(429).send({ error: 'Too many requests' })
            }

            // Fetch user info + org details from Clerk Backend API
            const clerk = createClerkClient({ secretKey: clerkSecretKey })
            const clerkUser = await clerk.users.getUser(userId)
            const firstName = clerkUser.firstName ?? 'User'
            const lastName = clerkUser.lastName ?? ''

            let projectDisplayName: string
            let memberRole: string

            if (orgId) {
                try {
                    const [org, memberships] = await Promise.all([
                        clerk.organizations.getOrganization({ organizationId: orgId }),
                        clerk.users.getOrganizationMembershipList({ userId }),
                    ])
                    projectDisplayName = org.name
                    const membership = memberships.data.find(m => m.organization.id === orgId)
                    memberRole = membership?.role === 'org:admin' ? 'ADMIN' : 'EDITOR'
                }
                catch {
                    projectDisplayName = `${firstName}'s Workspace`
                    memberRole = 'ADMIN'
                }
            }
            else {
                // No org — this is the user's personal workspace; they are always the admin.
                projectDisplayName = `${firstName}'s Workspace`
                memberRole = 'ADMIN'
            }

            // Sign the AP external token (RS256, verified by external-token-extractor)
            const externalToken = await jwtUtils.sign({
                payload: {
                    externalUserId: userId,
                    externalProjectId: orgId ?? userId,
                    firstName,
                    lastName,
                    projectDisplayName,
                    role: memberRole,
                },
                key: privateKeyPem,
                expiresInSeconds: 300,
                keyId: signingKeyId,
                algorithm: JwtSignAlgorithm.RS256,
                issuer: 'otom8',
            })

            // Exchange with managed-authn service (same layer as /api/v1/managed-authn/external-token)
            const apAuth = await managedAuthnService(req.log).externalToken({
                externalAccessToken: externalToken,
            })

            const responseParam = encodeURIComponent(JSON.stringify(apAuth))
            const frontendBase = (process.env.AP_FRONTEND_URL ?? '').replace(/\/$/, '')
            return reply.redirect(`${frontendBase}/authenticate?response=${responseParam}`)
        },
    )
}
