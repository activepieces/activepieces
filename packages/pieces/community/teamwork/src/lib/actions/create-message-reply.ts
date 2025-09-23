import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createMessageReply = createAction({
	name: 'create_message_reply',
	displayName: 'Create Message Reply',
	description: 'Reply to a Teamwork message',
	auth: teamworkAuth,
	props: {
		messageId: Property.ShortText({ displayName: 'Message ID', required: true }),
		body: Property.LongText({ displayName: 'Body', required: true }),
	},
	async run({ auth, propsValue }) {
		const body = { message: { body: propsValue.body } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/messages/${propsValue.messageId}/replies.json`, body });
	},
});


