import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
	Property,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftOutlookAuth>, {
	sender?: string;
	recipient?: string;
}> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages = [];
		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		let response: PageCollection = await client
			.api(`/me/mailFolders/inbox/messages?${filter}`)
			.orderby('receivedDateTime desc')
			.get();

		if (lastFetchEpochMS === 0) {
			for (const message of response.value as Message[]) {
				messages.push(message);
			}
		} else {
			while (response.value.length > 0) {
				for (const message of response.value as Message[]) {
					messages.push(message);
				}

				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		let filteredMessages = messages;
		
		if (propsValue?.sender) {
			filteredMessages = filteredMessages.filter(
				(message) => {
					const messageSenderEmail = message.from?.emailAddress?.address?.toLowerCase();
					const filterSenderEmail = propsValue.sender?.toLowerCase();			
					return messageSenderEmail === filterSenderEmail;
				}
			);
		}

		if (propsValue?.recipient) {
			filteredMessages = filteredMessages.filter(
				(message) => {
					const hasRecipient = message.toRecipients?.some(
						(recipient) => {
							const recipientEmail = recipient.emailAddress?.address?.toLowerCase();
							const filterRecipientEmail = propsValue.recipient?.toLowerCase();
							return recipientEmail === filterRecipientEmail;
						}
					);
					return hasRecipient;
				}
			);
		}
		return filteredMessages.map((message) => ({
			epochMilliSeconds: dayjs(message.receivedDateTime).valueOf(),
			data: message,
		}));
	},
};

export const newEmailTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newEmail',
	displayName: 'New Email',
	description: 'Triggers when a new email is received in the inbox.',
	props: {
		sender: Property.ShortText({
			displayName: 'From (Sender Email)',
			description: 'Filter emails from a specific sender (optional). Leave empty to for all senders.',
			required: false,
		}),
		recipient: Property.ShortText({
			displayName: 'To (Recipient Email)',
			description: 'Filter emails to a specific recipient (optional). Leave empty to for all recipients.',
			required: false,
		}),
	},
	sampleData: {},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
