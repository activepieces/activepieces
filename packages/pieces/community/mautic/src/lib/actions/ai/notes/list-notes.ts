import { createAction } from '@activepieces/pieces-framework';

import { mauticListNotesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListNotesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_notes',
	outputSchema: mauticListNotesOutputSchema,
	displayName: 'List Notes',
	description: 'Lists Mautic notes.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists notes across all contacts. Use Where with col "lead" to narrow to one contact, or List Contact Notes. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'notes',
			key: 'notes',
			query: context.propsValue,
		});
	},
});
