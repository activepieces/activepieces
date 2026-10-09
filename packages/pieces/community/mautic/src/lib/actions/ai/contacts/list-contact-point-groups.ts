import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactPointGroupsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactPointGroupsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_point_groups',
	outputSchema: mauticListContactPointGroupsOutputSchema,
	displayName: 'List Contact Point Groups',
	description: 'Lists the point group scores of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the contact's score in every point group, with group id and name. Needs Mautic 5.1 or later.",
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
	},
	async run(context) {
		return await mauticApi.listContactPointGroups({
			auth: context.auth,
			id: context.propsValue.id,
		});
	},
});
