import { Property, createAction } from '@activepieces/pieces-framework';
import { spaceIdDropdown, postIdDropdown, BASE_URL } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { circleAuth } from '../common/auth';
import { isNil } from '@activepieces/shared';

interface CreateCommentPayload {
	post_id: number;
	body: string;
	parent_comment_id?: number;
	skip_notifications?: boolean;
}

export const createComment = createAction({
	auth: circleAuth,
	name: 'create_comment',
	displayName: 'Create Comment',
	description: 'Creates a new comment on a post.',
	props: {
		space_id: spaceIdDropdown,
		post_id: postIdDropdown,
		body: Property.LongText({
			displayName: 'Comment Body',
			description: 'The content of the comment.',
			required: true,
		}),
		parent_comment_id: Property.Number({
			displayName: 'Parent Comment ID (Optional)',
			description: 'ID of the comment to reply to. Leave empty if not a reply.',
			required: false,
		}),
		skip_notifications: Property.Checkbox({
			displayName: 'Skip Notifications',
			description: 'Skip sending notifications for this comment?',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { post_id, body, parent_comment_id, skip_notifications } = context.propsValue;

		if (post_id === undefined) {
			throw new Error('Post ID is required but was not provided.');
		}
		if (body === undefined) {
			throw new Error('Comment body is required but was not provided.');
		}

		const payload: CreateCommentPayload = {
			post_id: post_id,
			body: body,
		};

		if (!isNil(parent_comment_id)) {
			payload.parent_comment_id = parent_comment_id;
		}
		if (skip_notifications !== undefined) {
			payload.skip_notifications = skip_notifications;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${BASE_URL}/comments`,
			body: payload,
			headers: {
				Authorization: `Bearer ${context.auth}`,
				'Content-Type': 'application/json',
			},
		});

		return response.body;
	},
});
