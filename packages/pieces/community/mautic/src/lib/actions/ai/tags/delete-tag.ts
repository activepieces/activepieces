import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteTagOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteTagAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_tag',
	outputSchema: mauticDeleteTagOutputSchema,
	displayName: 'Delete Tag',
	description: 'Permanently deletes a Mautic tag.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a tag and removes it from every contact. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Tag Id',
			description: 'Numeric tag id, from List Tags or Create Tag.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'tags',
			id: context.propsValue.id,
		});
	},
});
