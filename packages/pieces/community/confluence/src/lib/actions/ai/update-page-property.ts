import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdatePagePropertyOutputSchema } from '../../output-schemas';

export const updatePagePropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_page_property',
	outputSchema: confluenceUpdatePagePropertyOutputSchema,
	displayName: 'Update Page Property',
	description: 'Replaces the value of a content property on a page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the JSON value of an existing content property on a Confluence page, saving it as the next version; the key is kept unless you set a new one. Get the property ID from List Page Properties. Idempotent: setting the same value again leaves it unchanged.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		propertyId: confluenceAiProps.propertyId({ required: true }),
		value: confluenceAiProps.propertyValue({
			required: true,
			description: 'New JSON object or array; replaces the current value.',
		}),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'New key. Leave empty to keep the current key.',
		}),
	},
	async run(context) {
		const { pageId, propertyId, value, key } = context.propsValue;
		const current = await confluenceApi.getContentProperty({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			propertyId,
		});
		return await confluenceApi.updateContentProperty({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			propertyId,
			key: key ?? current.key,
			value,
			versionNumber: current.version.number + 1,
		});
	},
});
