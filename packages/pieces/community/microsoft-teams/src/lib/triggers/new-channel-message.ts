import { microsoftTeamsAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	AppConnectionValueForAuthProperty,
	Store,
	TriggerStrategy,
	tryCatch,
} from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsUtils } from '../common/utils';
import type { ChatMessage, MicrosoftTeamsPage } from '../common/types';
import dayjs from 'dayjs';

import { isNil } from '@activepieces/pieces-framework';
import { newChannelMessageOutputSchema } from '../output-schemas';

export const newChannelMessageTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-channel-message',
	outputSchema: newChannelMessageOutputSchema,
	classification: 'READ',
	displayName: 'New Channel Message',
	description: 'Triggers when a new message is posted in a channel.',
	aiMetadata: {
		description: 'Fires when a new message is posted in the selected Microsoft Teams channel (by team ID and channel ID). Each event represents the posted channel message and its content. Polls periodically, so events appear with a short delay rather than instantly.',
	},
	props: {
		teamId: microsoftTeamsProps.teamId({ required: true }),
		channelId: microsoftTeamsProps.channelId({ required: true }),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await context.store.delete(DELTA_LINK_KEY);
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		replyToId: null,
		etag: '1747831213175',
		messageType: 'message',
		createdDateTime: '2025-05-21T12:40:13.175Z',
		lastModifiedDateTime: '2025-05-21T12:40:13.175Z',
		lastEditedDateTime: null,
		deletedDateTime: null,
		subject: 'Test',
		summary: null,
		chatId: null,
		importance: 'normal',
		locale: 'en-us',
		webUrl:'',
		policyViolation: null,
		eventDetail: null,
		id: '1747831213175',
		from: {
			application: null,
			device: null,
			user: {
				'@odata.type': '#microsoft.graph.teamworkUserIdentity',
				id: '90b3720d-f459-42c1-a02e-a1ecb068',
				displayName: 'Activepieces',
				userIdentityType: 'aadUser',
				tenantId: '9b37335a-d996-4a8d-9ae4-a3a04c94',
			},
		},
		body: {
			contentType: 'html',
			content: '<p>Test Message</p>',
		},
		channelIdentity: {
			teamId: '99cb9-7ebe-43ee-a69b-5f77ce8a4b4e',
			channelId: '19:LiZnIkTo_1FmFY9OTsfym0q3bwo-y2UfV9FaYA1@thread.tacv2',
		},
		attachments: [],
		mentions: [],
		reactions: [],
	},
});

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const { teamId, channelId } = propsValue;
		const client = microsoftTeamsClient.create({ auth });

		const messages =
			lastFetchEpochMS === 0
				? await listLatestMessages({ client, teamId, channelId })
				: await readChannelDelta({ client, store, teamId, channelId, since: lastFetchEpochMS });

		return messages.filter(microsoftTeamsUtils.isPostedMessage).map((message: ChatMessage) => {
			return {
				epochMilliSeconds: dayjs(message.createdDateTime).valueOf(),
				data: message,
			};
		});
	},
};

async function listLatestMessages({ client, teamId, channelId }: ChannelParams): Promise<ChatMessage[]> {
	const response: MicrosoftTeamsPage<ChatMessage> = await microsoftTeamsClient.withRetry(() =>
		client.api(`/teams/${teamId}/channels/${channelId}/messages`).top(5).get(),
	);
	return response.value ?? [];
}

async function readChannelDelta({
	client,
	store,
	teamId,
	channelId,
	since,
}: ChannelParams & { store: Store; since: number }): Promise<ChatMessage[]> {
	const startUrl = `/teams/${teamId}/channels/${channelId}/messages/delta?$filter=lastModifiedDateTime gt ${new Date(since).toISOString()}`;
	const savedLink = await store.get<string>(DELTA_LINK_KEY);
	const resumeLink =
		!isNil(savedLink) && decodeURIComponent(savedLink).includes(`/teams/${teamId}/channels/${channelId}/`) ? savedLink : null;
	if (isNil(resumeLink)) {
		return readDeltaPages({ client, store, url: startUrl });
	}
	const { data, error } = await tryCatch(() => readDeltaPages({ client, store, url: resumeLink }));
	if (error === null) {
		return data;
	}
	if (!REJECTED_LINK_STATUS_CODES.includes(microsoftTeamsClient.errorStatusCode({ error }))) {
		throw error;
	}
	await store.delete(DELTA_LINK_KEY);
	return readDeltaPages({ client, store, url: startUrl });
}

async function readDeltaPages({ client, store, url }: { client: Client; store: Store; url: string }): Promise<ChatMessage[]> {
	const startedAt = Date.now();
	const messages: ChatMessage[] = [];
	let nextUrl: string | undefined = url;
	while (nextUrl) {
		const requestUrl: string = nextUrl;
		const response: MicrosoftTeamsPage<ChatMessage> = await microsoftTeamsClient.withRetry(() => client.api(requestUrl).get());
		messages.push(...(response.value ?? []));
		nextUrl = response['@odata.nextLink'];
		const deltaLink = response['@odata.deltaLink'];
		if (deltaLink) {
			await store.put<string>(DELTA_LINK_KEY, deltaLink);
		} else if (nextUrl && Date.now() - startedAt > TIME_BUDGET_MS) {
			await store.put<string>(DELTA_LINK_KEY, nextUrl);
			return messages;
		}
	}
	return messages;
}

const DELTA_LINK_KEY = 'deltalink';
const TIME_BUDGET_MS = 40_000;
const REJECTED_LINK_STATUS_CODES = [400, 404, 410];

type Props = {
	teamId: string;
	channelId: string;
};

type ChannelParams = {
	client: Client;
	teamId: string;
	channelId: string;
};
