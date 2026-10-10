import { createAction } from '@activepieces/pieces-framework';

import { mauticGetDynamicContentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetDynamicContentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_dynamic_content',
	outputSchema: mauticGetDynamicContentOutputSchema,
	displayName: 'Get Dynamic Content',
	description: 'Gets one Mautic dynamic content by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single dynamic content item by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Dynamic Content Id',
			description:
				'Numeric dynamic content id, from List Dynamic Contents or Create Dynamic Content.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'dynamiccontents',
			id: context.propsValue.id,
		});
	},
});
