import { createTrigger, DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';

const polling: Polling<string, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const res = await teamworkRequest(auth, { method: HttpMethod.GET, path: `/people.json`, query: { pageSize: 50, sort: 'createdAt:desc' } as any });
		const people = (res?.data?.people ?? []) as any[];
		return people
			.map((p) => ({
				epochMilliSeconds: p['created-at'] ? Number(p['created-at']) * 1000 : Date.now(),
				data: p,
			}))
			.filter((i) => !lastFetchEpochMS || i.epochMilliSeconds > lastFetchEpochMS);
	},
};

export const newPerson = createTrigger({
	name: 'new_person',
	displayName: 'New Person',
	description: 'Fires when a new person is added',
	auth: teamworkAuth,
	props: {},
	triggers: [],
	type: TriggerStrategy.POLLING,
	onEnable: async () => {},
	onDisable: async () => {},
	polling: pollingHelper.createPolling({ polling, pollInterval: 15, pollTimeout: 10 }),
});


