import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { getTaskListsDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';
import { TodoTask } from '@microsoft/microsoft-graph-types';

const polling: Polling<OAuth2PropertyValue, { task_list_id: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, store, lastFetchEpochMS }) => {
		const taskListId = propsValue.task_list_id;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const tasks = [];

		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=createdDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		let response: PageCollection = await client
			.api(`/me/todo/lists/${taskListId}/tasks?${filter}`)
			.get();

		if (lastFetchEpochMS === 0) {
			for (const task of response.value as TodoTask[]) {
				tasks.push(task);
			}
		} else {
			while (response.value.length > 0) {
				for (const task of response.value as TodoTask[]) {
					tasks.push(task);
				}

				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		return tasks.map((task) => ({
			epochMilliSeconds: dayjs(task.createdDateTime).valueOf(),
			data: task,
		}));
	},
};

export const newTaskCreatedTrigger = createTrigger({
	name: 'new_task_created',
	displayName: 'New Task',
	description: 'Triggers when a new task is created.',
	auth: microsoftToDoAuth,
	props: {
		task_list_id: Property.Dropdown({
			displayName: 'Task List',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return { disabled: true, placeholder: 'Connect your account first', options: [] };
				}
				return await getTaskListsDropdown(auth as OAuth2PropertyValue);
			},
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
		'@odata.etag': 'W/"vVwdQvxCiE6779iYhchMrAAGgwrb4w=="',
		importance: 'normal',
		isReminderOn: false,
		status: 'notStarted',
		title: 'fdfdfd',
		createdDateTime: '2025-05-08T12:40:55.3080693Z',
		lastModifiedDateTime: '2025-05-08T12:40:55.3533435Z',
		hasAttachments: false,
		categories: [],
		id: 'AQMkADAwATM3ZmYAZS0xNGVmLWNiZmYALTAwAi0wMAoARgAAAw8tTPoZEYtLvE5mK48wuvIHAL1cHUL8QohOu_-YmIXITKwABoMc5_AAAAC9XB1C-EKITrvv2JiFyEysAAaDHTv2AAAA',
		body: {
			content: '',
			contentType: 'text',
		},
	},
});
