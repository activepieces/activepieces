import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceMovePageOutputSchema } from '../../output-schemas';

export const movePageAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_move_page',
	outputSchema: confluenceMovePageOutputSchema,
	displayName: 'Move Page',
	description: 'Moves a page relative to a target page.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Moves a Confluence page relative to a target page: append makes it the last child of the target, before and after place it as a sibling. Both IDs come from List Pages. Idempotent: repeating the same move leaves the page where it is.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		position: Property.StaticDropdown({
			displayName: 'Position',
			description: 'Where to put the page relative to the target page.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Append as last child of target', value: 'append' },
					{ label: 'Before target (sibling)', value: 'before' },
					{ label: 'After target (sibling)', value: 'after' },
				],
			},
		}),
		targetId: confluenceAiProps.pageId({
			required: true,
			displayName: 'Target Page ID',
			description: 'Page to move relative to, from List Pages.',
		}),
	},
	async run(context) {
		const { pageId, position, targetId } = context.propsValue;
		await confluenceApi.movePage({ auth: context.auth, pageId, position, targetPageId: targetId });
		return { pageId, position, targetId };
	},
});
