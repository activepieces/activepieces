import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactFieldsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListContactFieldsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_fields',
	outputSchema: mauticListContactFieldsOutputSchema,
	displayName: 'List Contact Fields',
	description: 'Lists the contact fields available in Mautic.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every contact field, including custom ones, with its alias. Use the aliases as keys in Additional Fields of Create Contact and Update Contact, and as columns in List Contacts filters.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.listContactOptions({ auth: context.auth, list: 'fields' });
	},
});
