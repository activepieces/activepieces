import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import JwksRsa from 'jwks-rsa'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { JwtSignAlgorithm, jwtUtils } from '../helper/jwt-utils'
import { teamsBotService } from './teams-bot.service'

const BOT_FRAMEWORK_JWKS_URI = 'https://login.botframework.com/v1/.well-known/keys'
const BOT_FRAMEWORK_ISSUER = 'https://api.botframework.com'

const jwksClient = JwksRsa({
    jwksUri: BOT_FRAMEWORK_JWKS_URI,
    cacheMaxEntries: 10,
})

async function verifyBotFrameworkJwt(token: string, expectedAppId: string | undefined): Promise<boolean> {
    try {
        const { header } = jwtUtils.decode({ jwt: token })
        const signingKey = await jwksClient.getSigningKey(header.kid)
        const publicKey = signingKey.getPublicKey()
        await jwtUtils.decodeAndVerify({
            jwt: token,
            key: publicKey,
            algorithm: JwtSignAlgorithm.RS256,
            issuer: BOT_FRAMEWORK_ISSUER,
            audience: expectedAppId,
        })
        return true
    }
    catch {
        return false
    }
}

export const teamsBotController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post('/webhook', WebhookRequest, async (request, reply) => {
        const authHeader = request.headers['authorization'] ?? ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
        const activity = request.body as TeamsActivity

        const recipientId = activity.recipient?.id ?? ''
        const appId = recipientId.startsWith('28:') ? recipientId.slice(3) : undefined

        const isValid = await verifyBotFrameworkJwt(token, appId)
        if (!isValid) {
            return reply.status(StatusCodes.UNAUTHORIZED).send()
        }

        if (activity.type === 'installationUpdate' && appId) {
            const tenantId = activity.channelData?.tenant?.id
            const teamsTeamId = activity.channelData?.team?.aadGroupId
            if (tenantId && teamsTeamId) {
                if (activity.action === 'add' && activity.serviceUrl) {
                    await teamsBotService.handleInstallation({ appId, tenantId, teamsTeamId, serviceUrl: activity.serviceUrl })
                }
                else if (activity.action === 'remove') {
                    await teamsBotService.handleUninstallation({ appId, tenantId, teamsTeamId })
                }
            }
        }

        return reply.status(StatusCodes.OK).send()
    })

    fastify.post('/send', SendRequest, async (request, reply) => {
        const { appId, appSecret, tenantId, teamId, channelId, content, contentType } = request.body
        const result = await teamsBotService.sendToChannel({ appId, appSecret, tenantId, teamId, channelId, content, contentType })
        return reply.status(StatusCodes.OK).send(result)
    })
}

type TeamsActivity = {
    type: string
    action?: string
    serviceUrl: string
    recipient?: { id: string }
    channelData?: {
        tenant?: { id: string }
        team?: { id: string, aadGroupId?: string }
    }
}

const WebhookRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.object({}).passthrough(),
    },
}

const SendRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: z.object({
            appId: z.string(),
            appSecret: z.string(),
            tenantId: z.string(),
            teamId: z.string(),
            channelId: z.string(),
            content: z.string(),
            contentType: z.string(),
        }),
    },
}
