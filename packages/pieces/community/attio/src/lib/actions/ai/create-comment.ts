import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioCreateCommentOutputSchema } from '../../output-schemas';

export const attioCreateCommentAction = createAction({
	auth: attioAuth,
	name: 'attio_create_comment',
	outputSchema: attioCreateCommentOutputSchema,
	displayName: 'Create Comment',
	description: 'Comments on a record, a list entry, or replies in a thread.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Posts a comment as a workspace member (ID from List Workspace Members). Give exactly one target: Thread ID to reply, Object with Record ID for a record, or List with Entry ID for a list entry. Not idempotent.',
		idempotent: false,
	},
	props: {
		content: Property.LongText({ displayName: 'Content', required: true }),
		author_id: Property.ShortText({ displayName: 'Author ID', description: 'Workspace member ID, from List Workspace Members.', required: true }),
		thread_id: Property.ShortText({ displayName: 'Thread ID', description: 'Reply in this thread.', required: false }),
		object: Property.ShortText({ displayName: 'Object', description: 'Object slug, with Record ID.', required: false }),
		record_id: Property.ShortText({ displayName: 'Record ID', required: false }),
		list: Property.ShortText({ displayName: 'List', description: 'List slug or ID, with Entry ID.', required: false }),
		entry_id: Property.ShortText({ displayName: 'Entry ID', required: false }),
	},
	async run(context) {
		const { content, author_id, thread_id, object, record_id, list, entry_id } = context.propsValue;
		const targets = [thread_id, object && record_id, list && entry_id].filter(Boolean);
		if (targets.length !== 1) {
			throw new Error('Provide exactly one target: Thread ID, Object with Record ID, or List with Entry ID.');
		}
		const target = thread_id
			? { thread_id }
			: object && record_id
				? { record: { object, record_id } }
				: { entry: { list, entry_id } };
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/comments`,
			body: { data: { format: 'plaintext', content, author: { type: 'workspace-member', id: author_id }, ...target } },
		});
		return response.data;
	},
});
