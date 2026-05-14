import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import * as jsonwebtoken from 'jsonwebtoken'
import JwksRsa from 'jwks-rsa'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { teamsBotService } from './teams-bot.service'

const BOT_FRAMEWORK_JWKS_URI = 'https://login.botframework.com/v1/.well-known/keys'
const BOT_FRAMEWORK_ISSUER = 'https://api.botframework.com'

const jwksClient = JwksRsa({
    jwksUri: BOT_FRAMEWORK_JWKS_URI,
    cache: true,
    cacheMaxEntries: 10,
    cacheMaxAge: 600_000,
})

async function verifyBotFrameworkJwt(token: string): Promise<boolean> {
    try {
        const decoded = jsonwebtoken.decode(token, { complete: true })
        if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
            return false
        }
        const signingKey = await jwksClient.getSigningKey(decoded.header.kid)
        const publicKey = signingKey.getPublicKey()
        jsonwebtoken.verify(token, publicKey, { issuer: BOT_FRAMEWORK_ISSUER })
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
        const isValid = await verifyBotFrameworkJwt(token)
        if (!isValid) {
            return reply.status(StatusCodes.UNAUTHORIZED).send()
        }

        const activity = request.body as TeamsActivity
        if (activity.type === 'installationUpdate' && activity.action === 'add') {
            const tenantId = activity.channelData?.tenant?.id
            const teamsTeamId = activity.channelData?.teamsTeamId
            const serviceUrl = activity.serviceUrl
            if (tenantId && teamsTeamId && serviceUrl) {
                await teamsBotService.handleInstallation({ tenantId, teamsTeamId, serviceUrl })
            }
        }

        return reply.status(StatusCodes.OK).send()
    })

    fastify.post('/send', SendRequest, async (request, reply) => {
        const { tenantId, teamId, channelId, content, contentType } = request.body
        await teamsBotService.sendToChannel({ tenantId, teamId, channelId, content, contentType })
        return reply.status(StatusCodes.OK).send()
    })
}

type TeamsActivity = {
    type: string
    action?: string
    serviceUrl: string
    channelData?: {
        tenant?: { id: string }
        teamsTeamId?: string
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
            tenantId: z.string(),
            teamId: z.string(),
            channelId: z.string(),
            content: z.string(),
            contentType: z.string(),
        }),
    },
}
