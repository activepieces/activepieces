import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { ticktickAuth } from '../../index';
import { tickTickApiCall } from '../common/client';
import {
	TICKTICK_PRIORITY_HIGH,
	TICKTICK_PRIORITY_LOW,
	TICKTICK_PRIORITY_MEDIUM,
	TICKTICK_PRIORITY_NONE,
} from '../common/constants';
import { projectId } from '../common/props';

export const createTaskAction = createAction({
	auth: ticktickAuth,
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Creates a new in a specific list.',
	props: {
		projectId: projectId({
			displayName: 'List',
			description: 'The list to create the task in.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Task Title',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Task Content',
			required: false,
		}),
		desc: Property.LongText({
			displayName: 'Description (Checklist)',
			description: 'Description of the checklist, often used with subtasks (items).',
			required: false,
		}),
		startDate: Property.DateTime({
			displayName: 'Start Date',
			required: false,
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			required: false,
		}),
		priority: Property.StaticDropdown({
			displayName: 'Priority',
			required: false,
			options: {
				options: [
					{ label: 'None', value: TICKTICK_PRIORITY_NONE },
					{ label: 'Low', value: TICKTICK_PRIORITY_LOW },
					{ label: 'Medium', value: TICKTICK_PRIORITY_MEDIUM },
					{ label: 'High', value: TICKTICK_PRIORITY_HIGH },
				],
			},
		}),
	},
	async run(context) {
		const { projectId, title, content, desc, startDate, dueDate, priority } = context.propsValue;

		const createTaskParams: Record<string, any> = {
			title,
			projectId: projectId as string,
		};

		if (content) createTaskParams['content'] = content;
		if (desc) createTaskParams['desc'] = desc;
		if (startDate)
			createTaskParams['startDate'] = dayjs(startDate).format('YYYY-MM-DDTHH:mm:ssZZ');
		if (dueDate) createTaskParams['dueDate'] = dayjs(dueDate).format('YYYY-MM-DDTHH:mm:ssZZ');
		if (priority) createTaskParams['priority'] = priority;

		const response = await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task',
			body: createTaskParams,
		});

		return response;
	},
});
