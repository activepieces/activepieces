import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteCategoryOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteCategoryAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_category',
	outputSchema: mauticDeleteCategoryOutputSchema,
	displayName: 'Delete Category',
	description: 'Permanently deletes a Mautic category.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a category; items in it become uncategorized. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Category Id',
			description: 'Numeric category id, from List Categories or Create Category.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'categories',
			id: context.propsValue.id,
		});
	},
});
