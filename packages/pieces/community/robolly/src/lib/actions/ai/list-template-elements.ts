import { createAction } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';

export const listTemplateElementsAction = createAction({
	auth: robollyAuth,
	name: 'robolly_list_template_elements',
	displayName: 'List Template Elements',
	description: "Lists a template's elements and the modifications each one accepts.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns a template's element names with their types, the detailed modification keys each element accepts (e.g. title.textColor) and the value catalog for them. Call it before Render Template, Create Hidden Render Link or Render Video to know which modification keys to send.",
		idempotent: true,
	},
	props: {
		templateId: robollyAiProps.templateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.getAcceptedModifications({ auth, templateId: propsValue.templateId });
	},
});
