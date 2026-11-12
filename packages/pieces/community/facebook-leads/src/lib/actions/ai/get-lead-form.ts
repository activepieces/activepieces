import { createAction } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsAiProps } from '../../common/ai-props';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsGetLeadFormOutputSchema } from '../../output-schemas';

export const getLeadFormAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_get_lead_form',
	outputSchema: facebookLeadsGetLeadFormOutputSchema,
	displayName: 'Get Lead Form',
	description: 'Gets a lead form, including its questions.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one lead form by ID: name, status, locale, lead and expired-lead counts, its questions (the field keys a lead answers), privacy policy URL and the Page it belongs to. Use it to learn which field keys the leads of a form carry.',
		idempotent: true,
	},
	props: {
		formId: facebookLeadsAiProps.formId({ required: true }),
	},
	async run(context) {
		return await facebookLeadsApi.getLeadForm({
			formId: context.propsValue.formId,
			accessToken: context.auth.access_token,
		});
	},
});
