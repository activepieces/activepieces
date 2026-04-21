import { cryptoUtils } from '@activepieces/server-utils'
import { apId, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { sso } from '@better-auth/sso'
import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { twoFactor } from 'better-auth/plugins'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { getPostgresConnectionString } from '../../database/database-connection'
import { DatabaseType } from '../../database/database-type'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { passwordHasher } from '../lib/password-hasher'
import { userIdentityRepository } from '../user-identity/user-identity-service'
import { betterAuthService } from './better-auth-service'

async function getBetterAuthDatabase() {
    const dbType = system.get(AppSystemProp.DB_TYPE)
    if (dbType === DatabaseType.PGLITE) {
        const { getPGliteInstance } = await import('typeorm-pglite')
        const { PGliteDialect } = await import('kysely-pglite-dialect')
        const pglite = await getPGliteInstance()
        return { dialect: new PGliteDialect(pglite), type: 'postgres' as const }
    }
    const { default: pg } = await import('pg')
    return new pg.Pool({ connectionString: getPostgresConnectionString() })
}

async function createBetterAuth(log: FastifyBaseLogger) {
    const database = await getBetterAuthDatabase()
    const service = betterAuthService(log)

    return betterAuth({
        basePath: '/v1/better-auth',
        database,
        rateLimit: {
            enabled: true,
            window: 60,
            max: 10,
            storage: 'database',
            customRules: {
                '/two-factor/*': {
                    window: 10,
                    max: 3,
                },
            },
        },
        advanced: {
            database: {
                generateId: () => apId(),
            },
            ipAddress: {
                ipAddressHeaders: [
                    system.get(AppSystemProp.CLIENT_REAL_IP_HEADER) ?? 'x-real-ip',
                    'x-forwarded-for',
                ],
            },
        },
        user: {
            modelName: 'user_identity',
            additionalFields: {
                firstName: {
                    type: 'string',
                    returned: true,
                    required: true,
                    input: true,
                    defaultValue: 'Unknown',
                },
                lastName: {
                    type: 'string',
                    returned: true,
                    required: true,
                    input: true,
                    defaultValue: 'Unknown',
                },
                provider: {
                    type: 'string',
                    returned: true,
                    required: true,
                    input: true,
                    defaultValue: 'SSO',
                },
                trackEvents: {
                    type: 'boolean',
                    returned: true,
                },
                newsLetter: {
                    type: 'boolean',
                    returned: true,
                },
                tokenVersion: {
                    type: 'string',
                    returned: true,
                },
            },
        },
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            sendResetPassword: service.sendResetPassword,
            password: {
                hash: passwordHasher.hash,
                verify: (data) => passwordHasher.compare(data.password, data.hash),
            },
        },
        emailVerification: {
            sendOnSignUp: false,
            sendVerificationEmail: service.sendVerificationEmail,
        },
        trustedOrigins: [
            system.getOrThrow(AppSystemProp.FRONTEND_URL),
            'https://accounts.google.com',
            'https://*.googleapis.com',
        ],
        plugins: [
            twoFactor({ issuer: 'Activepieces', allowPasswordless: true }),
            sso({
                redirectURI: `${system.getOrThrow(AppSystemProp.FRONTEND_URL)}/api/v1/better-auth/sso/callback`,
                trustEmailVerified: true,
                provisionUser: async ({ user, userInfo }) => {
                    const nameParts = (userInfo.name ?? '').split(' ')
                    await userIdentityRepository().update(user.id, {
                        firstName: nameParts[0] ?? 'Unknown',
                        lastName: nameParts.slice(1).join(' ') || 'Unknown',
                        tokenVersion: nanoid(),
                        password: await passwordHasher.hash(await cryptoUtils.generateRandomPassword()),
                        imageUrl: userInfo.image ?? undefined,
                    })
                },
                provisionUserOnEveryLogin: false,
            }),
        ],
        hooks: {
            before: createAuthMiddleware(service.beforeHook),
            after: createAuthMiddleware(service.afterHook),
        },
    })
}


let authInstance: Awaited<ReturnType<typeof createBetterAuth>> | null = null

export const betterAuthInstance = {
    init: async (log: FastifyBaseLogger) => {
        if (!isNil(authInstance)) return
        authInstance = await createBetterAuth(log)
    },
    get: () => {
        assertNotNullOrUndefined(authInstance, 'better-auth not initialized')
        return authInstance
    },
}
