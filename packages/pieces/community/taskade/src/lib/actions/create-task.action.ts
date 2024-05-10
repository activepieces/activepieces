import { taskadeAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import dayjs from 'dayjs';
import { TaskadeAPIClient } from '../common/client';
import { CreateTaskDateParams } from '../common/types';

export const createTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-create-task',
	displayName: 'Create Task',
	description: 'Creates a new task.',
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		content_type: Property.StaticDropdown({
			displayName: 'Content Type',
			required: true,
			defaultValue: 'text/markdown',
			options: {
				disabled: false,
				options: [
					{
						label: 'text/markdown',
						value: 'text/markdown',
					},
					{
						label: 'text/plain',
						value: 'text/plain',
					},
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Task Content',
			required: true,
		}),
		placement: Property.StaticDropdown({
			displayName: 'Placement',
			required: true,
			defaultValue: 'afterbegin',
			options: {
				disabled: false,
				options: [
					{
						label: 'afterbegin',
						value: 'afterbegin',
					},
					{
						label: 'beforeend',
						value: 'beforeend',
					},
				],
			},
		}),
		start_date: Property.DateTime({
			displayName: 'Start Date',
			required: true,
		}),
		end_date: Property.DateTime({
			displayName: 'End Date',
			required: false,
		}),
	},
	async run(context) {
		const { project_id, content_type, content, placement } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth);

		const task = await client.createTask(project_id, {
			content,
			contentType: content_type,
			placement,
		});

		const createDateBody: CreateTaskDateParams = {
			start: {
				date: dayjs(context.propsValue.start_date).format('YYYY-MM-DD'),
				time: dayjs(context.propsValue.start_date).format('HH:mm:ss'),
			},
		};

		if (context.propsValue.end_date) {
			createDateBody.end = {
				date: dayjs(context.propsValue.end_date).format('YYYY-MM-DD'),
				time: dayjs(context.propsValue.end_date).format('HH:mm:ss'),
			};
		}

		return await client.createTaskDate(project_id, task.items[0].id, createDateBody);
	},
});
