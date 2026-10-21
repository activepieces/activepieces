import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreatePagePropertyOutputSchema } from '../../output-schemas';

export const createPagePropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_page_property',
	outputSchema: confluenceCreatePagePropertyOutputSchema,
	displayName: 'Create Page Property',
	description: 'Stores a new content property on a page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stores a new content property (a key with a JSON value) on a Confluence page. Fails if the key already exists there; use Update Page Property to change it. Not idempotent.',
		idempotent: false,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		key: confluenceAiProps.propertyKey({ required: true }),
		value: confluenceAiProps.propertyValue({ required: true }),
	},
	async run(context) {
		const { pageId, key, value } = context.propsValue;
		return await confluenceApi.createContentProperty({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			key,
			value,
		});
	},
});
