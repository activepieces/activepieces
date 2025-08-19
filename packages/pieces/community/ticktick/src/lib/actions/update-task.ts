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
import { projectId, taskId } from '../common/props';


export const updateTaskAction = createAction({
	auth: ticktickAuth,
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Update an existing task.',
	props: {
		projectId: projectId({
			displayName: 'List',
			description: 'The list to update the task in.',
			required: true,
		}),
		taskId: taskId({
			displayName: 'Task ID',
			description: 'The ID of the task to update.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		content: Property.LongText({
			displayName: 'Content',
			required: false,
		}),
		desc: Property.LongText({
			displayName: 'Description (Checklist)',
			description: 'New description of the checklist items. Replaces existing.',
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
		const { taskId, projectId, title, content, desc, startDate, dueDate, priority } =
			context.propsValue;

		const updateTaskParams: Record<string, any> = {
			id: taskId,
			projectId: projectId as string,
		};

		if (title) updateTaskParams['title'] = title;
		if (content) updateTaskParams['content'] = content;
		if (desc) updateTaskParams['desc'] = desc;
		if (startDate)
			updateTaskParams['startDate'] = dayjs(startDate).format('YYYY-MM-DDTHH:mm:ssZZ');
		if (dueDate) updateTaskParams['dueDate'] = dayjs(dueDate).format('YYYY-MM-DDTHH:mm:ssZZ');
		if (priority) updateTaskParams['priority'] = priority;

		const response = await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/task/${taskId}`,
			body: updateTaskParams,
		});

		return response;
	},
});
