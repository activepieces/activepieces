import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { listCommentsOutputSchema } from '../output-schemas';

export const listCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'list-comments',
	outputSchema: listCommentsOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Comments',
	description: 'Lists footer and/or inline comments on a page.',
	audience: 'human',
	aiMetadata: { description: 'Lists comments on a Confluence page; a comment-type selector controls whether it returns footer comments, inline comments, or both (fetched separately and returned under footer/inline keys). Body representation (storage or atlas doc) is selectable. Use to read or enumerate a page\'s comments. Read-only and idempotent.', idempotent: true },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		commentType: Property.StaticDropdown({
			displayName: 'Comment Type',
			required: true,
			defaultValue: 'footer',
			options: {
				disabled: false,
				options: [
					{ label: 'Footer comments', value: 'footer' },
					{ label: 'Inline comments', value: 'inline' },
					{ label: 'Both', value: 'both' },
				],
			},
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			required: true,
			defaultValue: 'storage',
			options: {
				disabled: false,
				options: [
					{ label: 'Storage (XHTML)', value: 'storage' },
					{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
				],
			},
		}),
	},
	async run(context) {
		const { pageId, commentType, bodyFormat } = context.propsValue;

		const fetchComments = async (type: string) =>
			await confluenceApi.listPageComments({
				auth: context.auth,
				pageId,
				commentType: type,
				bodyFormat,
			});

		if (commentType === 'both') {
			const [footer, inline] = await Promise.all([fetchComments('footer'), fetchComments('inline')]);
			return { footer, inline };
		}

		return { results: await fetchComments(commentType) };
	},
});
