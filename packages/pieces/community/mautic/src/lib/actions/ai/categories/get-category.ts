import { createAction } from '@activepieces/pieces-framework';

import { mauticCreateCategoryOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetCategoryAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_category',
	outputSchema: mauticCreateCategoryOutputSchema,
	displayName: 'Get Category',
	description: 'Gets one Mautic category by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single category by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Category Id',
			description: 'Numeric category id, from List Categories or Create Category.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'categories',
			id: context.propsValue.id,
		});
	},
});
