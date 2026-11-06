import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceGetTemplateOutputSchema } from '../../output-schemas';

export const getTemplateAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_template',
	outputSchema: confluenceGetTemplateOutputSchema,
	displayName: 'Get Template',
	description: 'Gets a page template, with its body.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence page template by ID, including its storage-format body with any template variables. Get template IDs from List Templates.',
		idempotent: true,
	},
	props: {
		templateId: Property.ShortText({
			displayName: 'Template ID',
			description: 'Template ID, from List Templates.',
			required: true,
		}),
	},
	async run(context) {
		return await confluenceApi.getTemplateDetails({
			auth: context.auth,
			templateId: context.propsValue.templateId,
		});
	},
});
