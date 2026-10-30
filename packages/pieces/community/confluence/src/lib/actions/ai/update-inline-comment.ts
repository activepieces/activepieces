import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateInlineCommentOutputSchema } from '../../output-schemas';

export const updateInlineCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_inline_comment',
	outputSchema: confluenceUpdateInlineCommentOutputSchema,
	displayName: 'Update Inline Comment',
	description: 'Changes the body of an inline comment, or resolves or reopens it.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the body of a Confluence inline comment and/or resolves or reopens it, keeping whatever you leave unset. Resolving applies to top-level inline comments, not replies. Idempotent: repeating the same change leaves the comment in the same state.',
		idempotent: true,
	},
	props: {
		commentId: confluenceAiProps.commentId({ required: true }),
		body: confluenceAiProps.body({
			required: false,
			description:
				'New comment body; replaces the whole body. Leave empty to keep the current one.',
		}),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
		resolved: Property.StaticDropdown({
			displayName: 'Resolved',
			description: 'Resolve or reopen the comment. Leave empty to keep its state.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Resolve', value: 'true' },
					{ label: 'Reopen', value: 'false' },
				],
			},
		}),
	},
	async run(context) {
		const { commentId, body, bodyFormat, resolved } = context.propsValue;
		if (body === undefined && resolved === undefined) {
			throw new Error('Set Body, Resolved, or both.');
		}
		const current = await confluenceApi.getVersionedContent({
			auth: context.auth,
			contentType: 'inline-comments',
			contentId: commentId,
		});
		return await confluenceApi.updateComment({
			auth: context.auth,
			commentType: 'inline-comments',
			commentId,
			representation: body === undefined ? 'storage' : bodyFormat ?? 'storage',
			value: body ?? current.body?.storage?.value ?? '',
			versionNumber: current.version.number + 1,
			resolved: resolved === undefined ? undefined : resolved === 'true',
		});
	},
});
