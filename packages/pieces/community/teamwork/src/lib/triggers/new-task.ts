import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newTask = createTrigger({
	name: 'new_task',
	displayName: 'New Task',
	description: 'Fires when a task is created.',
	auth: teamworkAuth,
	props: {
		projectId: Property.Dropdown({
			displayName: 'Project',
			description: 'The project to watch for new tasks. If not specified, all projects will be watched.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as PiecePropValueSchema<typeof teamworkAuth>, {
					method: HttpMethod.GET,
					path: '/projects.json',
				});
				const options = res.data.projects.map((p: { id: string; name: string }) => ({
					label: p.name,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const res = await teamworkRequest(context.auth as PiecePropValueSchema<typeof teamworkAuth>, {
			method: HttpMethod.POST,
			path: '/webhooks.json',
			body: {
				webhook: {
					event: 'TASK.CREATED',
					url: context.webhookUrl,
					version: 'v3',
				},
			},
		});
		await context.store.put('webhookId', res.data.id);
	},
	async onDisable(context) {
		const webhookId = await context.store.get('webhookId');
		if (webhookId) {
			await teamworkRequest(context.auth as PiecePropValueSchema<typeof teamworkAuth>, {
				method: HttpMethod.DELETE,
				path: `/webhooks/${webhookId}.json`,
			});
		}
	},
	async run(context) {
		const payload = context.payload.body as any;
		if (context.propsValue.projectId) {
			if (String(payload?.task?.projectId) === context.propsValue.projectId) {
				return [payload];
			}
			return [];
		}
		return [payload];
	},
	sampleData: {},
});


