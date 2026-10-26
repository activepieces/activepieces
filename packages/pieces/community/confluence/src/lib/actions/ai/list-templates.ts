import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListTemplatesOutputSchema } from '../../output-schemas';

export const listTemplatesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_templates',
	outputSchema: confluenceListTemplatesOutputSchema,
	displayName: 'List Templates',
	description: 'Lists page templates, globally or in a space.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists Confluence page templates with their IDs and names; set a space key for that space templates, or leave it empty for global ones. Use the ID with Get Template or Create Page from Template. Page with Start and Limit.',
		idempotent: true,
	},
	props: {
		spaceKey: confluenceAiProps.spaceKey({
			required: false,
			description:
				'Space key (not ID) whose templates to list, from Get Space. Leave empty for global templates.',
		}),
		start: Property.Number({
			displayName: 'Start',
			description: 'Offset of the first item (0-based). Defaults to 0.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of items to return. Defaults to 25.',
			required: false,
		}),
	},
	async run(context) {
		const { spaceKey, start, limit } = context.propsValue;
		return await confluenceApi.listPageTemplatesPage({
			auth: context.auth,
			query: { spaceKey, start, limit: limit ?? 25 },
		});
	},
});
