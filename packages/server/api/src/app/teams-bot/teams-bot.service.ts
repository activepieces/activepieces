import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { teamsBotInstallationDb } from './teams-bot-installation.repo'

export const teamsBotService = {
    async handleInstallation({ tenantId, teamsTeamId, serviceUrl }: {
        tenantId: string
        teamsTeamId: string
        serviceUrl: string
    }): Promise<void> {
        await teamsBotInstallationDb.upsert({ tenantId, teamsTeamId, serviceUrl })
    },

    async sendToChannel({ tenantId, teamId, channelId, content, contentType }: {
        tenantId: string
        teamId: string
        channelId: string
        content: string
        contentType: string
    }): Promise<void> {
        const installation = await teamsBotInstallationDb.findOne({ tenantId, teamsTeamId: teamId })
        if (isNil(installation)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Activepieces Bot is not installed in this team. Add it from the Teams App Store first.',
                },
            })
        }

        const botToken = await getBotFrameworkToken()
        const conversationId = await createChannelConversation({
            serviceUrl: installation.serviceUrl,
            botToken,
            channelId,
        })
        await sendActivity({
            serviceUrl: installation.serviceUrl,
            botToken,
            conversationId,
            content,
            contentType,
        })
    },
}

async function getBotFrameworkToken(): Promise<string> {
    const botAppId = system.getOrThrow(AppSystemProp.TEAMS_BOT_APP_ID)
    const botAppSecret = system.getOrThrow(AppSystemProp.TEAMS_BOT_APP_SECRET)

    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: botAppId,
        client_secret: botAppSecret,
        scope: 'https://api.botframework.com/.default',
    })

    const response = await safeHttp.axios.post<{ access_token: string }>(
        'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    return response.data.access_token
}

async function createChannelConversation({ serviceUrl, botToken, channelId }: {
    serviceUrl: string
    botToken: string
    channelId: string
}): Promise<string> {
    const botAppId = system.getOrThrow(AppSystemProp.TEAMS_BOT_APP_ID)

    const response = await safeHttp.axios.post<{ id: string }>(
        `${serviceUrl}v3/conversations`,
        {
            isGroup: true,
            bot: { id: `28:${botAppId}`, name: 'Activepieces' },
            channelData: { channel: { id: channelId } },
        },
        { headers: { Authorization: `Bearer ${botToken}` } },
    )

    return response.data.id
}

async function sendActivity({ serviceUrl, botToken, conversationId, content, contentType }: {
    serviceUrl: string
    botToken: string
    conversationId: string
    content: string
    contentType: string
}): Promise<void> {
    await safeHttp.axios.post(
        `${serviceUrl}v3/conversations/${conversationId}/activities`,
        {
            type: 'message',
            text: content,
            textFormat: contentType,
        },
        { headers: { Authorization: `Bearer ${botToken}` } },
    )
}
