import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contacts',
	outputSchema: mauticListContactsOutputSchema,
	displayName: 'List Contacts',
	description: 'Lists Mautic contacts, filtered by a search string or field conditions.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contacts with paging, sorting and filters. Use Search for free text or commands like "email:jane@example.com", or Where for exact column conditions such as email eq a value. Returns the matching contacts and the total count; page with Start and Limit.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'contacts',
			key: 'contacts',
			query: context.propsValue,
		});
	},
});
