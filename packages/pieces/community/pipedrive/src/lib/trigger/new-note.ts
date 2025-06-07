import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveApiCall, pipedriveCommon } from '../common';
import { LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

export const newNoteTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'new-note',
	displayName: 'New Note',
	description: 'Triggers when a new note is created.',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await pipedriveCommon.subscribeWebhook(
			'note',
			'added',
			context.webhookUrl!,
			context.auth.data['api_domain'],
			context.auth.access_token,
		);
		await context.store?.put<{
			webhookId: string;
		}>('_new_note_trigger', {
			webhookId: webhook.data.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<{
			webhookId: string;
		}>('_new_note_trigger');
		if (response !== null && response !== undefined) {
			await pipedriveCommon.unsubscribeWebhook(
				response.webhookId,
				context.auth.data['api_domain'],
				context.auth.access_token,
			);
		}
	},
	async test(context) {
		const response = await pipedriveApiCall<LeadListResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/notes',
			query: { limit: 10, sort: 'update_time DESC' },
		});

		if (isNil(response.data)) {
			return [];
		}

		return response.data;
	},
	async run(context) {
		const payloadBody = context.payload.body as {
			current: Record<string, unknown>;
			previous: Record<string, unknown>;
		};

		return [payloadBody.current];
	},
	sampleData: {
		id: 1,
		user_id: 22701301,
		deal_id: null,
		person_id: 1,
		org_id: 1,
		lead_id: null,
		content: 'Note',
		add_time: '2024-12-04 06:48:26',
		update_time: '2024-12-04 06:48:26',
		active_flag: true,
		pinned_to_deal_flag: false,
		pinned_to_person_flag: false,
		pinned_to_organization_flag: false,
		pinned_to_lead_flag: false,
		last_update_user_id: null,
		organization: { name: 'Pipedrive' },
		person: { name: 'John' },
		deal: null,
		lead: null,
		user: {
			email: 'test@gmail.com',
			name: 'John',
			icon_url: null,
			is_you: true,
		},
	},
});
