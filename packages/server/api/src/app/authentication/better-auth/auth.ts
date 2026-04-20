import { cryptoUtils } from '@activepieces/server-utils'
import { sso } from '@better-auth/sso'
import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { twoFactor } from 'better-auth/plugins'
import { nanoid } from 'nanoid'
import pg from 'pg'
import { getPostgresConnectionString } from '../../database/database-connection'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { passwordHasher } from '../lib/password-hasher'
import { userIdentityRepository } from '../user-identity/user-identity-service'
import { betterAuthService } from './better-auth-service'

const { Pool } = pg

const service = betterAuthService(system.globalLogger())

const auth = betterAuth({
    basePath: '/v1/better-auth',
    database: new Pool({
        connectionString: getPostgresConnectionString(),
    }),
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
        sendVerificationEmail: service.sendVerificationEmail,
    },
    trustedOrigins: async (request) => {
        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        if (!request) {
            return [frontendUrl]
        }
        if (request.url.includes('/sso/')) {
            const origin = request.headers.get('origin')
            return origin ? [frontendUrl, origin] : [frontendUrl]
        }
        return [frontendUrl]
    },
    plugins: [
        twoFactor({ issuer: 'Activepieces' }),
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

export default auth
