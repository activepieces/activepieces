import {
	DedupeStrategy,
	HttpMethod,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { workdayRequest, WorkdayService } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const hiredAfter = dayjs(lastFetchEpochMS).toISOString();
		const response = await workdayRequest<{
			data: { id: string; descriptor: string; hireDate: string }[];
		}>(auth, HttpMethod.GET, '/workers', undefined, { hiredAfter }, WorkdayService.staffing);

		const items = response.body.data ?? [];
		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.hireDate).valueOf(),
			data: item,
		}));
	},
};

export const newHireCreated = createTrigger({
	auth: workdayAuth,
	name: 'new_hire_created',
	displayName: 'New Hire Created',
	description: 'Triggers when a new employee is hired in Workday.',
	props: {},
	sampleData: {
		id: '3aa5550b7fe348b98d7b5741afc65534',
		descriptor: 'John Smith',
		hireDate: '2026-04-01',
	},
	type: TriggerStrategy.POLLING,
	async test(ctx) {
		return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files });
	},
	async onEnable(ctx) {
		await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue });
	},
	async onDisable(ctx) {
		await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue });
	},
	async run(ctx) {
		return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files });
	},
});
