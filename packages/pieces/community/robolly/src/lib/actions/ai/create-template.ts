import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';
import { robollyCreateTemplateOutputSchema } from '../../output-schemas';

export const createTemplateAction = createAction({
	auth: robollyAuth,
	name: 'robolly_create_template',
	outputSchema: robollyCreateTemplateOutputSchema,
	displayName: 'Create Template',
	description: 'Creates a blank template in your Robolly account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a blank template (an empty canvas, no elements) in the Robolly account and returns it with its ID; elements are added in the Robolly editor. Each call creates another template, plans cap the number of templates, and the API offers no way to delete one.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The template name.',
			required: true,
		}),
		...robollyAiProps.templateFields(),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.createTemplate({
			auth,
			fields: {
				name: propsValue.name,
				artboardWidth: propsValue.artboardWidth,
				artboardHeight: propsValue.artboardHeight,
				backgroundColor: propsValue.backgroundColor,
				path: propsValue.path,
				renderFileName: propsValue.renderFileName,
				disallowNotSigned: propsValue.disallowNotSigned,
			},
		});
	},
});
