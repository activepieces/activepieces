import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactFormSubmissionsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactFormSubmissionsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_form_submissions',
	outputSchema: mauticListContactFormSubmissionsOutputSchema,
	displayName: 'List Contact Form Submissions',
	description: 'Lists the submissions of a Mautic form made by one contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the submissions one contact made on a form, with the submitted values. Order By and Where columns take the "s." prefix, e.g. "s.date_submitted".',
		idempotent: true,
	},
	props: {
		formId: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
		...mauticAiProps.filterOptions,
	},
	async run(context) {
		return await mauticApi.listFormSubmissions({
			auth: context.auth,
			formId: context.propsValue.formId,
			contactId: context.propsValue.contactId,
			query: context.propsValue,
		});
	},
});
