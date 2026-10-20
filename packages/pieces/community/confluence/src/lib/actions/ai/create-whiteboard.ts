import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateFolderOutputSchema } from '../../output-schemas';

export const createWhiteboardAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_whiteboard',
	outputSchema: confluenceCreateFolderOutputSchema,
	displayName: 'Create Whiteboard',
	description: 'Creates a whiteboard in a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Confluence whiteboard in a space, optionally under a parent page or folder and from a built-in template key. Not idempotent: each call creates another whiteboard.',
		idempotent: false,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		parentId: Property.ShortText({
			displayName: 'Parent ID',
			description:
				'ID of the page, folder or whiteboard to create it under. Leave empty for the space root.',
			required: false,
		}),
		templateKey: Property.ShortText({
			displayName: 'Template Key',
			description:
				'Built-in whiteboard template, e.g. "4ls-retro", "daily-sync" or "concept-map". Leave empty for a blank board.',
			required: false,
		}),
		isPrivate: Property.Checkbox({
			displayName: 'Private',
			description: 'Restrict the whiteboard so only you can view and edit it.',
			required: false,
		}),
	},
	async run(context) {
		const { spaceId, title, parentId, templateKey, isPrivate } = context.propsValue;
		return await confluenceApi.createWhiteboard({
			auth: context.auth,
			spaceId,
			title,
			parentId,
			templateKey,
			isPrivate,
		});
	},
});
