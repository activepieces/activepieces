import { createTrigger, DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';

const polling: Polling<string, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const res = await teamworkRequest(auth, { method: HttpMethod.GET, path: `/invoices.json`, query: { pageSize: '50', sort: 'createdAt:desc' } });
		const invoices = (res?.data?.invoices ?? []) as any[];
		return invoices
			.map((i) => ({ epochMilliSeconds: i['created-at'] ? Number(i['created-at']) * 1000 : Date.now(), data: i }))
			.filter((i) => !lastFetchEpochMS || i.epochMilliSeconds > lastFetchEpochMS);
	},
};

export const newInvoice = createTrigger({
	name: 'new_invoice',
	displayName: 'New Invoice',
	description: 'Fires when a new invoice is created',
	auth: teamworkAuth,
	props: {},
	triggers: [],
	type: TriggerStrategy.POLLING,
	onEnable: async () => {},
	onDisable: async () => {},
	polling: pollingHelper.createPolling({ polling, pollInterval: 30, pollTimeout: 10 }),
});


