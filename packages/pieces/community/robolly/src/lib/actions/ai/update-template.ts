import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';
import { robollyUpdateTemplateOutputSchema } from '../../output-schemas';

export const updateTemplateAction = createAction({
	auth: robollyAuth,
	name: 'robolly_update_template',
	outputSchema: robollyUpdateTemplateOutputSchema,
	displayName: 'Update Template',
	description: "Updates a template's name and canvas settings.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a template's name and canvas settings in the Robolly account, changing only the fields sent, and returns the template ID. Get the template ID from List Templates or Create Template.",
		idempotent: true,
	},
	props: {
		templateId: robollyAiProps.templateId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new template name.',
			required: false,
		}),
		...robollyAiProps.templateFields(),
	},
	async run({ auth, propsValue }) {
		await robollyApi.updateTemplate({
			auth,
			templateId: propsValue.templateId,
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
		return { success: true, templateId: propsValue.templateId };
	},
});
