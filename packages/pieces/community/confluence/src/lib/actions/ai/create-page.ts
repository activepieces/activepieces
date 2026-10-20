import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreatePageOutputSchema } from '../../output-schemas';

export const createPageAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_page',
	outputSchema: confluenceCreatePageOutputSchema,
	displayName: 'Create Page',
	description: 'Creates a page in a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Confluence page in a space, optionally under a parent page, published or as a draft. Get the space ID from List Spaces and a parent page ID from List Pages. Not idempotent: each call creates another page.',
		idempotent: false,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Page title. Must be unique within the space for published pages.',
			required: true,
		}),
		body: confluenceAiProps.body({ required: false }),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
		parentId: confluenceAiProps.pageId({
			required: false,
			displayName: 'Parent Page ID',
			description:
				'Page to nest the new page under. Leave empty to create it under the space homepage.',
		}),
		status: confluenceAiProps.contentStatus({
			required: false,
			description: 'Published (current) or draft. Defaults to published.',
		}),
		isPrivate: Property.Checkbox({
			displayName: 'Private',
			description: 'Restrict the page so only you can view and edit it.',
			required: false,
		}),
	},
	async run(context) {
		const { spaceId, title, body, bodyFormat, parentId, status, isPrivate } = context.propsValue;
		return await confluenceApi.createPage({
			auth: context.auth,
			spaceId,
			parentId,
			title,
			status: status ?? 'current',
			representation: bodyFormat ?? 'storage',
			value: body ?? '',
			isPrivate,
		});
	},
});
