import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import { getAppOnlyToken } from './graph';
import { microsoftCloud } from './microsoft-cloud';

const BOT_CONNECTOR_SCOPE = 'https://api.botframework.com/.default';

const sendChannelMessage = async ({
	appId,
	appSecret,
	tenantId,
	teamId,
	channelId,
	content,
	contentType,
}: SendChannelMessageParams): Promise<SendChannelMessageResult> => {
	const { data: botToken, error: tokenError } = await tryCatch(() =>
		getAppOnlyToken({
			tenantId,
			appId,
			appSecret,
			scope: BOT_CONNECTOR_SCOPE,
		}),
	);

	if (tokenError) {
		throw new Error(
			describeFailure({
				error: tokenError,
				fallback:
					'Microsoft rejected the bot credentials. Check the Bot App ID, Bot App Secret and Tenant ID on this connection',
			}),
		);
	}

	const { data: created, error } = await tryCatch(() =>
		createChannelConversation({
			serviceUrl: microsoftCloud.getBotServiceUrl(),
			botToken,
			botAppId: appId,
			tenantId,
			channelId,
			content,
			contentType,
		}),
	);

	if (error) {
		throw new Error(describeConversationError(error));
	}

	const messageId = created.activityId ?? created.id.split('messageid=')[1] ?? created.id;
	return {
		id: created.id,
		activityId: created.activityId ?? messageId,
		messageId,
		messageType: 'message',
		webUrl: `https://teams.microsoft.com/l/message/${encodeURIComponent(
			channelId,
		)}/${messageId}?groupId=${teamId}&tenantId=${tenantId}&createdTime=${messageId}&parentMessageId=${messageId}`,
		teamId,
		channelId,
		tenantId,
	};
};

const createChannelConversation = async ({
	serviceUrl,
	botToken,
	botAppId,
	tenantId,
	channelId,
	content,
	contentType,
}: CreateChannelConversationParams): Promise<CreateConversationResponse> => {
	const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
	const response = await httpClient.sendRequest<CreateConversationResponse>({
		method: HttpMethod.POST,
		url: `${baseUrl}v3/conversations`,
		headers: { Authorization: `Bearer ${botToken}` },
		body: {
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
	});

	return response.body;
};

function describeConversationError(error: Error): string {
	const status = error instanceof HttpError ? error.response.status : undefined;
	if (status === 401) {
		return 'Microsoft rejected the bot token. Check that the Microsoft Teams channel is enabled on the Azure Bot resource.';
	}
	if (status === 403 || status === 404) {
		return "Activepieces Bot is not installed in this team. Upload the bot's Teams app package and add it to this team, then try again.";
	}
	return describeFailure({ error, fallback: 'Failed to send the Teams channel message' });
}

function describeFailure({ error, fallback }: { error: Error; fallback: string }): string {
	if (error instanceof HttpError) {
		return `${fallback} (HTTP ${error.response.status}): ${JSON.stringify(error.response.body)}`;
	}
	return `${fallback}: ${error.message}`;
}

export const botConnector = { sendChannelMessage };

type SendChannelMessageParams = {
	appId: string;
	appSecret: string;
	tenantId: string;
	teamId: string;
	channelId: string;
	content: string;
	contentType: string;
};

type CreateChannelConversationParams = {
	serviceUrl: string;
	botToken: string;
	botAppId: string;
	tenantId: string;
	channelId: string;
	content: string;
	contentType: string;
};

type CreateConversationResponse = {
	id: string;
	activityId?: string;
};

type SendChannelMessageResult = {
	id: string;
	activityId: string;
	messageId: string;
	messageType: string;
	webUrl: string;
	teamId: string;
	channelId: string;
	tenantId: string;
};
