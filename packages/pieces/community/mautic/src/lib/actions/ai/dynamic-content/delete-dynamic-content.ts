import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteDynamicContentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteDynamicContentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_dynamic_content',
	outputSchema: mauticDeleteDynamicContentOutputSchema,
	displayName: 'Delete Dynamic Content',
	description: 'Permanently deletes a Mautic dynamic content.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a dynamic content item. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Dynamic Content Id',
			description:
				'Numeric dynamic content id, from List Dynamic Contents or Create Dynamic Content.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'dynamiccontents',
			id: context.propsValue.id,
		});
	},
});
