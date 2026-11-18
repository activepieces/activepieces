import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { movePageOutputSchema } from '../output-schemas';

export const movePageAction = createAction({
	auth: confluenceAuth,
	name: 'move-page',
	outputSchema: movePageOutputSchema,
	classification: 'WRITE',
	displayName: 'Move Page',
	description: 'Moves a page to a new parent as a child, sibling, or to the top of the parent.',
	audience: 'human',
	aiMetadata: { description: 'Repositions a Confluence page in the content tree relative to a target page: append/insert it as a child of the target, or place it as a sibling after the target. Use to re-parent or reorder a page. Requires the page ID and the target page ID. Effectively idempotent — re-running with the same position and target leaves the page in the same place.', idempotent: true },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		position: Property.StaticDropdown({
			displayName: 'Position Relative to Target',
			required: true,
			defaultValue: 'append',
			options: {
				disabled: false,
				options: [
					{ label: 'Append as last child of target', value: 'append' },
					{ label: 'Insert as first child of target', value: 'before' },
					{ label: 'Place after target (sibling)', value: 'after' },
				],
			},
		}),
		targetPageId: Property.ShortText({
			displayName: 'Target Page ID',
			description:
				'The page to move relative to. Use "append" or "before" to nest under it, "after" to place as sibling.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, position, targetPageId } = context.propsValue;

		await confluenceApi.movePage({ auth: context.auth, pageId, position, targetPageId });

		return { success: true, pageId, position, targetPageId };
	},
});
