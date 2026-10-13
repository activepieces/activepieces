import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { listCampaignLanguagesOutputSchema } from '../output-schemas';

export const listCampaignLanguagesAction = createAction({
	auth: mailerLiteAuth,
	name: 'list_campaign_languages',
	classification: 'READ',
	displayName: 'List Campaign Languages',
	description: 'List the languages available for campaigns.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the languages MailerLite supports for campaigns, with their IDs. Pass an ID as language_id to create_campaign_draft or update_campaign_draft. Read-only.',
		idempotent: true,
	},
	outputSchema: listCampaignLanguagesOutputSchema,
	props: {},
	async run(context) {
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: '/campaigns/languages',
		});
		return body;
	},
});
