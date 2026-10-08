import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactCompaniesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactCompaniesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_companies',
	outputSchema: mauticListContactCompaniesOutputSchema,
	displayName: 'List Contact Companies',
	description: 'Lists the companies of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the companies a contact is linked to, including which one is primary.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
	},
	async run(context) {
		return await mauticApi.listContactRelation({
			auth: context.auth,
			id: context.propsValue.id,
			relation: 'companies',
		});
	},
});
