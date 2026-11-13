import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactNotesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactNotesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_notes',
	outputSchema: mauticListContactNotesOutputSchema,
	displayName: 'List Contact Notes',
	description: 'Lists the notes of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the notes on a contact, newest first by default; page with Start and Limit. Order By takes a column with the "n." prefix, e.g. "n.dateAdded"; a bare column name fails.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		...mauticAiProps.pageOptions,
	},
	async run(context) {
		return await mauticApi.listContactRelation({
			auth: context.auth,
			id: context.propsValue.id,
			relation: 'notes',
			query: context.propsValue,
		});
	},
});
