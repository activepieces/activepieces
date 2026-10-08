import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticListContactOwnersOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactOwnersAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_owners',
	outputSchema: mauticListContactOwnersOutputSchema,
	displayName: 'List Contact Owners',
	description: 'Lists the Mautic users that can own contacts.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists users that can be set as a contact owner, with their ids. Use an id as Owner Id in Create Contact or Update Contact.',
		idempotent: true,
	},
	props: {
		filter: Property.ShortText({
			displayName: 'Filter',
			description: 'Part of the user name to match.',
			required: false,
		}),
		start: mauticAiProps.pageOptions.start,
		limit: mauticAiProps.pageOptions.limit,
	},
	async run(context) {
		const { filter, start, limit } = context.propsValue;
		return await mauticApi.listContactOptions({
			auth: context.auth,
			list: 'owners',
			query: {
				...spreadIfDefined('filter', filter),
				...spreadIfDefined('start', start?.toString()),
				...spreadIfDefined('limit', limit?.toString()),
			},
		});
	},
});
