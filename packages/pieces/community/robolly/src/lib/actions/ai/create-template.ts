import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';

export const createTemplateAction = createAction({
	auth: robollyAuth,
	name: 'robolly_create_template',
	displayName: 'Create Template',
	description: 'Creates a template in your Robolly account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new template in the Robolly account and returns it with its ID. Each call creates another template, and the API offers no way to delete one.',
		idempotent: false,
	},
	props: {
		template: Property.Json({
			displayName: 'Template',
			description: 'The template fields to send, as a JSON object.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.createTemplate({ auth, template: propsValue.template });
	},
});
