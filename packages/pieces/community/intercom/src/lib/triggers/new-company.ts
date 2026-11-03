import { intercomAuth } from '../auth';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomClient, TriggerPayload } from '../common';
import { companyTriggerOutputSchema } from '../output-schemas';
import { COMPANY_SAMPLE } from '../common/webhook-samples';

export const newCompanyTrigger = createTrigger({
	auth: intercomAuth,
	name: 'new-company',
	classification: 'READ',
	displayName: 'New Company',
	description: 'Triggers when a new company is created.',
	aiMetadata: {
		description: 'Fires when a new company record is created in Intercom. Companies group related contacts under a single organization. Outputs the newly created company object with its attributes.',
	},
	props: {},
	outputSchema: companyTriggerOutputSchema,
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = await intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['company.created'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable() {
		return;
	},
	async test(context) {
		const client = await intercomClient(context.auth);

		const response = await client.companies.list({ per_page: 5 });

		return response.data;
	},
	async run(context) {
		const payload = context.payload.body as TriggerPayload;
		return [payload.data.item];
	},
	sampleData: COMPANY_SAMPLE,
});
