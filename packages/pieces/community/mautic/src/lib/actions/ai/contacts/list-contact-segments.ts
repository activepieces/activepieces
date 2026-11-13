import { createAction } from '@activepieces/pieces-framework';

import { mauticListContactSegmentsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListContactSegmentsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_contact_segments',
	outputSchema: mauticListContactSegmentsOutputSchema,
	displayName: 'List Contact Segments',
	description: 'Lists the segments of a Mautic contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the segments a contact belongs to.',
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
			relation: 'segments',
		});
	},
});
