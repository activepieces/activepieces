import { createAction } from '@activepieces/pieces-framework';

import { mauticListAvailableSegmentsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListAvailableSegmentsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_available_segments',
	outputSchema: mauticListAvailableSegmentsOutputSchema,
	displayName: 'List Available Segments',
	description: 'Lists the segments contacts can be added to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the segments the connected user can assign contacts to, with id, name and alias. Use List Contact Segments for the segments one contact belongs to.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.listContactOptions({ auth: context.auth, list: 'segments' });
	},
});
