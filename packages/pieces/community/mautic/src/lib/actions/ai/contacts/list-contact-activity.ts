import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactActivityOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactActivityAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_activity',
	outputSchema: mauticListContactActivityOutputSchema,
	displayName: 'List Contact Activity',
	description: 'Lists activity events of one Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the timeline events of one contact (page hits, email opens, form submissions, point changes and more). Filter by event type and date range; page with Page and Limit.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		...mauticAiProps.activityOptions,
	},
	async run(context) {
		return await mauticApi.listActivity({
			auth: context.auth,
			contactId: context.propsValue.id,
			query: context.propsValue,
		});
	},
});
