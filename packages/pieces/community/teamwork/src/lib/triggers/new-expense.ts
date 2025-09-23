import { createTrigger, DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';

const polling: Polling<string, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const res = await teamworkRequest(auth, { method: HttpMethod.GET, path: `/expenses.json`, query: { pageSize: '50', sort: 'createdAt:desc' } });
		const expenses = (res?.data?.expenses ?? []) as any[];
		return expenses
			.map((e) => ({ epochMilliSeconds: e['created-at'] ? Number(e['created-at']) * 1000 : Date.now(), data: e }))
			.filter((i) => !lastFetchEpochMS || i.epochMilliSeconds > lastFetchEpochMS);
	},
};

export const newExpense = createTrigger({
	name: 'new_expense',
	displayName: 'New Expense',
	description: 'Fires when a new expense is created',
	auth: teamworkAuth,
	props: {},
	triggers: [],
	type: TriggerStrategy.POLLING,
	onEnable: async () => {},
	onDisable: async () => {},
	polling: pollingHelper.createPolling({ polling, pollInterval: 15, pollTimeout: 10 }),
});


