import { createAction } from '@activepieces/pieces-framework';

import { mauticGetSegmentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_segment',
	outputSchema: mauticGetSegmentOutputSchema,
	displayName: 'Get Segment',
	description: 'Gets one Mautic segment by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single segment by its numeric id, with its filters.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Segment Id',
			description: 'Numeric segment id, from List Segments or Create Segment.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'segments',
			id: context.propsValue.id,
		});
	},
});
