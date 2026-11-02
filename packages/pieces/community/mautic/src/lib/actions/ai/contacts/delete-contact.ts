import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_contact',
	outputSchema: mauticDeleteContactOutputSchema,
	displayName: 'Delete Contact',
	description: 'Permanently deletes a Mautic contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a contact and its history. Cannot be undone. Get the id from List Contacts.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'contacts',
			id: context.propsValue.id,
		});
	},
});
