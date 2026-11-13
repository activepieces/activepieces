import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { jsmAuth } from '../auth';
import { newRequestPolling } from '../common/polling';
import { jsmProps } from '../common/props';
import { requestOutputSchema } from '../output-schemas';

export const newRequestTrigger = createTrigger({
	auth: jsmAuth,
	name: 'new_request',
	classification: 'READ',
	displayName: 'New Request',
	description: 'Triggers when a new request is created in a service desk.',
	aiMetadata: {
		description:
			'Fires once for each new request created in the chosen Jira Service Management service desk, with its status, reporter, request type and form fields. Polling-based, so a request arrives on the next poll, not instantly.',
	},
	outputSchema: requestOutputSchema,
	type: TriggerStrategy.POLLING,
	props: {
		serviceDeskId: jsmProps.serviceDesk(),
	},
	sampleData: {
		issue_id: '10042',
		issue_key: 'SD-42',
		summary: 'Laptop will not boot',
		description: 'It shows a black screen after the logo.',
		status: 'Waiting for support',
		status_category: 'NEW',
		status_changed_at: '2026-01-15T09:00:00+0000',
		request_type_id: '1',
		request_type_name: 'Get IT help',
		service_desk_id: '1',
		created_at: '2026-01-15T09:00:00+0000',
		reporter_account_id: '111111:11111111-1111-1111-1111-111111111111',
		reporter_username: null,
		reporter_name: 'Alice Example',
		reporter_email: 'alice@example.com',
		portal_url: 'https://example.atlassian.net/servicedesk/customer/portal/1/SD-42',
		agent_url: 'https://example.atlassian.net/browse/SD-42',
		fields: {
			summary: 'Laptop will not boot',
			description: 'It shows a black screen after the logo.',
		},
	},
	async onEnable(context) {
		await newRequestPolling.onEnable({ store: context.store, isRepublish: context.isRepublish });
	},
	async onDisable() {
		return;
	},
	async run(context) {
		return newRequestPolling.poll({
			auth: context.auth.props,
			store: context.store,
			serviceDeskId: context.propsValue.serviceDeskId,
		});
	},
	async test(context) {
		return newRequestPolling.test({
			auth: context.auth.props,
			serviceDeskId: context.propsValue.serviceDeskId,
		});
	},
});
