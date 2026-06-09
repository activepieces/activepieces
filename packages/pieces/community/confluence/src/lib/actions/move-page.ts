import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';
import { pageIdProp, spaceIdProp } from '../common/props';

export const movePageAction = createAction({
	auth: confluenceAuth,
	name: 'move-page',
	displayName: 'Move Page',
	description: 'Moves a page to a new parent as a child, sibling, or to the top of the parent.',
	audience: 'both',
	aiMetadata: { description: 'Repositions a Confluence page in the content tree relative to a target page: append/insert it as a child of the target, or place it as a sibling after the target. Use to re-parent or reorder a page. Requires the page ID and the target page ID. Effectively idempotent — re-running with the same position and target leaves the page in the same place.', idempotent: true },
	props: {
		spaceId: spaceIdProp,
		pageId: pageIdProp,
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

		await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.PUT,
			version: 'v1',
			resourceUri: `/content/${pageId}/move/${position}/${targetPageId}`,
		});

		return { success: true, pageId, position, targetPageId };
	},
});
