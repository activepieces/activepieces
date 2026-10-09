import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactFormSubmissionsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListFormSubmissionsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_form_submissions',
	outputSchema: mauticListContactFormSubmissionsOutputSchema,
	displayName: 'List Form Submissions',
	description: 'Lists the submissions of a Mautic form.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the submissions of a form with the submitted values, the contact and the page. Page with Start and Limit; the response has the total count. Order By and Where columns take the "s." prefix, e.g. "s.date_submitted"; a bare column name fails.',
		idempotent: true,
	},
	props: {
		formId: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms.',
		}),
		...mauticAiProps.filterOptions,
	},
	async run(context) {
		return await mauticApi.listFormSubmissions({
			auth: context.auth,
			formId: context.propsValue.formId,
			query: context.propsValue,
		});
	},
});
