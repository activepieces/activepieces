import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioGetThreadOutputSchema } from '../../output-schemas';

export const attioGetThreadAction = createAction({
	auth: attioAuth,
	name: 'attio_get_thread',
	outputSchema: attioGetThreadOutputSchema,
	displayName: 'Get Thread',
	description: 'Gets a comment thread and pages through its comments.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a thread with its comments, oldest first, up to 250 per page. Pass the returned cursor to read more.',
		idempotent: true,
	},
	props: {
		thread_id: Property.ShortText({ displayName: 'Thread ID', description: 'From List Threads or a comment.', required: true }),
		limit: attioAi.limitProp({ max: 250 }),
		cursor: attioAi.cursorProp(),
	},
	async run(context) {
		const { thread_id, limit, cursor } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/threads/${thread_id}`,
			query: { limit, cursor },
		});
		return { ...response.data, next_cursor: response.pagination?.['next_cursor'] ?? null };
	},
});
