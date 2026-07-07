import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { teamsBotInstallationDb } from './teams-bot-installation.repo'

export const teamsBotService = {
    async handleInstallation({ appId, tenantId, teamsTeamId, serviceUrl }: {
        appId: string
        tenantId: string
        teamsTeamId: string
        serviceUrl: string
    }): Promise<void> {
        await teamsBotInstallationDb.upsert({ appId, tenantId, teamsTeamId, serviceUrl })
    },

    async handleUninstallation({ appId, tenantId, teamsTeamId }: {
        appId: string
        tenantId: string
        teamsTeamId: string
    }): Promise<void> {
        await teamsBotInstallationDb.remove({ appId, tenantId, teamsTeamId })
    },

    async sendToChannel({ appId, appSecret, tenantId, teamId, channelId, content, contentType }: {
        appId: string
        appSecret: string
        tenantId: string
        teamId: string
        channelId: string
        content: string
        contentType: string
    }): Promise<SendChannelMessageResult> {
        const installation = await teamsBotInstallationDb.findOne({ appId, tenantId, teamsTeamId: teamId })
        if (isNil(installation)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Activepieces Bot is not installed in this team. Add it from the Teams App Store first.',
                },
            })
        }

        const botToken = await getBotFrameworkToken({ appId, appSecret, tenantId })
        const created = await createChannelConversation({
            serviceUrl: installation.serviceUrl,
            botToken,
            botAppId: appId,
            tenantId,
            channelId,
            content,
            contentType,
        })

        const messageId = created.activityId ?? created.id.split('messageid=')[1] ?? created.id
        return {
            id: created.id,
            activityId: created.activityId ?? messageId,
            messageId,
            messageType: 'message',
            webUrl: `https://teams.microsoft.com/l/message/${encodeURIComponent(channelId)}/${messageId}?groupId=${teamId}&tenantId=${tenantId}&createdTime=${messageId}&parentMessageId=${messageId}`,
            teamId,
            channelId,
            tenantId,
        }
    },
}

async function getBotFrameworkToken({ appId, appSecret, tenantId }: {
    appId: string
    appSecret: string
    tenantId: string
}): Promise<string> {
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: appSecret,
        scope: 'https://api.botframework.com/.default',
    })

    const response = await safeHttp.axios.post<{ access_token: string }>(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    return response.data.access_token
}

async function createChannelConversation({ serviceUrl, botToken, botAppId, tenantId, channelId, content, contentType }: {
    serviceUrl: string
    botToken: string
    botAppId: string
    tenantId: string
    channelId: string
    content: string
    contentType: string
}): Promise<CreateConversationResponse> {
    const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`
    const response = await safeHttp.axios.post<CreateConversationResponse>(
        `${baseUrl}v3/conversations`,
        {
            isGroup: true,
            bot: { id: `28:${botAppId}`, name: 'Activepieces' },
            channelData: {
                channel: { id: channelId },
                tenant: { id: tenantId },
            },
            activity: {
                type: 'message',
                text: content,
                textFormat: contentType === 'html' ? 'xml' : 'plain',
            },
        },
        { headers: { Authorization: `Bearer ${botToken}` } },
    )

    return response.data
}

type CreateConversationResponse = {
    id: string
    activityId?: string
}

type SendChannelMessageResult = {
    id: string
    activityId: string
    messageId: string
    messageType: string
    webUrl: string
    teamId: string
    channelId: string
    tenantId: string
}
