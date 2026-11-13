import { createAction } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsAiProps } from '../../common/ai-props';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsListLeadFormsOutputSchema } from '../../output-schemas';

export const listLeadFormsAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_list_lead_forms',
	outputSchema: facebookLeadsListLeadFormsOutputSchema,
	displayName: 'List Lead Forms',
	description: 'Lists the lead forms of a Facebook Page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every lead form (instant form) on a Facebook Page, active and archived, with its id, name, status, locale, creation time and lead count. Use it to find the Form ID that List Leads and Get Lead Form need.',
		idempotent: true,
	},
	props: {
		pageId: facebookLeadsAiProps.pageId({ required: true }),
	},
	async run(context) {
		const { pageId } = context.propsValue;
		const pageAccessToken = await facebookLeadsApi.getPageAccessToken({
			pageId,
			accessToken: context.auth.access_token,
		});
		const forms = await facebookLeadsApi.listLeadForms({
			pageId,
			accessToken: pageAccessToken,
			detailed: true,
		});
		return {
			forms: forms.map((form) => ({
				id: form.id,
				name: form.name,
				status: form.status,
				locale: form.locale ?? null,
				created_time: form.created_time ?? null,
				leads_count: form.leads_count ?? null,
			})),
			count: forms.length,
		};
	},
});
