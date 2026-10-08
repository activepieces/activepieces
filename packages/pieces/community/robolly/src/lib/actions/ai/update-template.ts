import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';

export const updateTemplateAction = createAction({
	auth: robollyAuth,
	name: 'robolly_update_template',
	displayName: 'Update Template',
	description: 'Updates a template in your Robolly account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a template in the Robolly account, changing only the fields sent. Get the template ID from List Templates or Create Template.',
		idempotent: true,
	},
	props: {
		templateId: robollyAiProps.templateId({ required: true }),
		changes: Property.Json({
			displayName: 'Changes',
			description: 'The template fields to change, as a JSON object.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.updateTemplate({
			auth,
			templateId: propsValue.templateId,
			changes: propsValue.changes,
		});
	},
});
