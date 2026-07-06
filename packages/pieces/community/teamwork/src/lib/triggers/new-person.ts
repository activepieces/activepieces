import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newPerson = createTrigger({
	name: 'new_person',
	displayName: 'New Person',
	description: 'Fires when a new person (user/contact) is added.',
	aiMetadata: {
		description: 'Fires when a new person — a user, collaborator, or contact — is added in Teamwork (USER.CREATED webhook). Each event represents one newly created person across the account.',
	},
	auth: teamworkAuth,
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const res = await teamworkRequest(context.auth, {
			method: HttpMethod.POST,
			path: '/webhooks.json',
			body: {
				webhook: {
					event: 'USER.CREATED',
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
			await teamworkRequest(context.auth, {
				method: HttpMethod.DELETE,
				path: `/webhooks/${webhookId}.json`,
			});
		}
	},
	async run(context) {
		const payload = context.payload.body;
		return [payload];
	},
	sampleData: {},
});


