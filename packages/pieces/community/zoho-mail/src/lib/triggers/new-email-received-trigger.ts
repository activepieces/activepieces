import {
	DedupeStrategy,
	HttpMethod,
	Polling,
	QueryParams,
	pollingHelper,
} from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId } from '../common/props';

type Props = {
	accountId?: string;
	folderId?: string;
};

const polling: Polling<PiecePropValueSchema<typeof zohoMailAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const { accountId, folderId } = propsValue;

		let page = 1;
		let hasMore = true;
		const allMessages = [];

		do {
			const queryParams: QueryParams = {
				start: page.toString(),
				limit: lastFetchEpochMS === 0 ? '10' : '200',
			};

			if (folderId) {
				queryParams['folderId'] = folderId;
			}

			const response = await zohoMailApiCall<{ data: { receivedTime: string }[] }>({
				auth,
				resourceUri: `/accounts/${accountId}/messages/view`,
				method: HttpMethod.GET,
				query: queryParams,
			});

			const messages = response.data || [];

			if (messages.length === 0) {
				break;
			}

			for (const msg of messages) {
				const receivedTime = Number(msg.receivedTime);
				if (lastFetchEpochMS > 0 && receivedTime <= lastFetchEpochMS) {
					hasMore = false;
					break; // Stop processing this page
				}
				allMessages.push(msg); // Only add if it's newer
			}

			// if it's test mode, only fetch first page
			if (lastFetchEpochMS === 0) break;

			if (!hasMore) {
				break;
			}
			page++;
		} while (hasMore);

		return allMessages.map((msg) => {
			return {
				epochMilliSeconds: Number(msg.receivedTime),
				data: msg,
			};
		});
	},
};

export const newEmailReceivedTrigger = createTrigger({
	auth: zohoMailAuth,
	name: 'new_email_received',
	displayName: 'New Email Received',
	description: 'Triggers when a new email is received in a specified folder (or inbox).',
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({
			displayName: 'Folder',
			description:
				'Select the folder to watch. If empty, watches the inbox/all messages based on API default.',
			required: false,
		}),
	},
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
	sampleData: {
		summary: 'test mail',
		sentDateInGMT: '1749273996000',
		calendarType: 0,
		subject: 'test mail',
		messageId: '1749293811021114900',
		flagid: 'flag_not_set',
		status2: '0',
		priority: '3',
		hasInline: 'false',
		toAddress: '',
		folderId: '7723149000000002014',
		ccAddress: 'Not Provided',
		hasAttachment: '0',
		size: '238',
		sender: 'john.doe@gmail.com',
		receivedTime: '1749293811018',
		fromAddress: 'john.doe@gmail.com',
		status: '0',
	},
});
