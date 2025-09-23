import { createTrigger, DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';

const props = {
	projectId: Property.ShortText({ displayName: 'Project ID (optional)', required: false }),
};

const polling: Polling<string, typeof props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const query: Record<string, string> = { pageSize: '50', sort: 'createdAt:desc' };
		if (propsValue.projectId) query['projectId'] = propsValue.projectId as string;
		const res = await teamworkRequest(auth, { method: HttpMethod.GET, path: `/files.json`, query });
		const files = (res?.data?.files ?? []) as any[];
		return files
			.map((f) => ({ epochMilliSeconds: f['uploaded-date'] ? Number(f['uploaded-date']) * 1000 : Date.now(), data: f }))
			.filter((i) => !lastFetchEpochMS || i.epochMilliSeconds > lastFetchEpochMS);
	},
};

export const newFile = createTrigger({
	name: 'new_file',
	displayName: 'New File',
	description: 'Fires when a new file is uploaded',
	auth: teamworkAuth,
	props,
	triggers: [],
	type: TriggerStrategy.POLLING,
	onEnable: async () => {},
	onDisable: async () => {},
	polling: pollingHelper.createPolling({ polling, pollInterval: 15, pollTimeout: 10 }),
});


