import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../common/auth';
import { sessionIdProp, websiteIdProp } from '../common/props';
import { crispApiCall } from '../common/client';

export const addNoteToConversationAction = createAction({
	auth: crispAuth,
	name: 'add_note',
	displayName: 'Add Note to Conversation',
	description: 'Adds an internal note to a conversation.',
	props: {
		websiteId: websiteIdProp,
		sessionId: sessionIdProp,
		content: Property.LongText({
			displayName: 'Note Content',
			required: true,
		}),
	},
	async run(context) {
		const { websiteId, sessionId, content } = context.propsValue;

		const response = await crispApiCall({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/website/${websiteId}/conversation/${sessionId}/message`,
			body: {
				type: 'note',
				from: 'operator',
				origin: 'chat',
				content,
			},
		});

		return response;
	},
});
