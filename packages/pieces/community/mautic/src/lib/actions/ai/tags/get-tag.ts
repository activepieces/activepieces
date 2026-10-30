import { createAction } from '@activepieces/pieces-framework';

import { mauticCreateTagOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetTagAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_tag',
	outputSchema: mauticCreateTagOutputSchema,
	displayName: 'Get Tag',
	description: 'Gets one Mautic tag by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single tag by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Tag Id',
			description: 'Numeric tag id, from List Tags or Create Tag.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'tags',
			id: context.propsValue.id,
		});
	},
});
