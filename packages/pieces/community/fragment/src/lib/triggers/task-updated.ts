import { AppConnectionValueForAuthProperty, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient, FragmentTask } from '../common/client';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<AppConnectionValueForAuthProperty<typeof fragmentAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const isTest = lastFetchEpochMS > 0;

		const qs: QueryParams = {
			order_by: 'updated_at',
			limit: isTest ? '10' : '100',
		};

		if (!isTest) {
			qs['updated_at_after'] = dayjs(lastFetchEpochMS).toISOString();
		}

		const response = await fragmentClient.makeRequest<{ items: FragmentTask[] }>(
			HttpMethod.GET,
			'/tasks',
			auth,
			undefined,
			qs,
		);

		const items = response.items.map((task) => ({
			epochMilliSeconds: dayjs(task.updated_at).valueOf(),
			data: task,
		}));

		return items;
	},
};

export const taskUpdatedTrigger = createTrigger({
	auth: fragmentAuth,
	name: 'task_updated',
	displayName: 'Task Updated',
	description: 'Triggers when a task is updated.',
	props: {},
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
		uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		archived: true,
		status: 'TODO',
		legacy_data: {},
		skills: ['3c90c3cc-0d44-4b50-8888-8dd25736052a'],
		queue_uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		assignee_uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		participants: {},
		case_uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		parent_uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		due_at: '2023-11-07T05:31:56Z',
		snooze_expires_at: '2023-11-07T05:31:56Z',
		fields: {},
		metadata_form_uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		form_data: {},
		form_type: '<string>',
		assigned_at: '2023-11-07T05:31:56Z',
		started_at: '2023-11-07T05:31:56Z',
		done_at: '2023-11-07T05:31:56Z',
		created_at: '2023-11-07T05:31:56Z',
		updated_at: '2023-11-07T05:31:56Z',
		assignee_updated_by: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		queue_updated_by: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		is_assigned_player: true,
		internal_created_at: '2023-11-07T05:31:56Z',
		internal_updated_at: '2023-11-07T05:31:56Z',
		external_created_at: '2023-11-07T05:31:56Z',
		external_updated_at: '2023-11-07T05:31:56Z',
		external_status: 'TODO',
		external_status_updated_at: '2023-11-07T05:31:56Z',
		external_assignee_uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
		queue_time: 123,
		queue_time_business: 123,
		work_time: 123,
		work_time_business: 123,
		incremental_work_time: 123,
		incremental_work_time_business: 123,
		resolution_time: 123,
		resolution_time_business: 123,
		num_children: 123,
		num_children_done: 123,
		sla_breach_at: '2023-11-07T05:31:56Z',
		sla_breach_business_at: '2023-11-07T05:31:56Z',
		wait_time: 123,
		wait_time_business: 123,
		review_status: '<string>',
		task_type: '<string>',
		played_at: '2023-11-07T05:31:56Z',
		assignee: {
			uid: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
			archived: true,
			role: 'super_admin',
			email: 'jsmith@example.com',
			first_name: '<string>',
			last_name: '<string>',
			skills: ['3c90c3cc-0d44-4b50-8888-8dd25736052a'],
			legacy_data: {},
			created_at: '2023-11-07T05:31:56Z',
			updated_at: '2023-11-07T05:31:56Z',
			is_registered: true,
		},
		parent: {},
		children: [{}],
	},
});
