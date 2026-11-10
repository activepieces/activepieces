import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteSegmentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_segment',
	outputSchema: mauticDeleteSegmentOutputSchema,
	displayName: 'Delete Segment',
	description: 'Permanently deletes a Mautic segment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a segment. Its contacts are kept. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Segment Id',
			description: 'Numeric segment id, from List Segments or Create Segment.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'segments',
			id: context.propsValue.id,
		});
	},
});
