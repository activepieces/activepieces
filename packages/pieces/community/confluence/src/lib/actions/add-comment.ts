import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';

export const addCommentAction = createAction({
	auth: confluenceAuth,
	name: 'add-comment',
	classification: 'WRITE',
	displayName: 'Add Comment to Page',
	description: 'Adds a footer comment to a page.',
	audience: 'both',
	aiMetadata: { description: 'Posts a new footer comment on a Confluence page, with the comment body given in storage (XHTML) format (plain text is accepted). Use to leave a top-level comment on a page; to respond to an existing comment use Reply to Comment instead. Not idempotent: each call adds another comment.', idempotent: false },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		body: Property.LongText({
			displayName: 'Comment',
			description: 'Comment body in storage (XHTML) format. Plain text works too.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, body } = context.propsValue;

		return await confluenceApi.createFooterComment({
			auth: context.auth,
			pageId,
			value: body,
		});
	},
});
