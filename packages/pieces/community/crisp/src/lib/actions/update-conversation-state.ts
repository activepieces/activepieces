import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../common/auth';
import { sessionIdProp, websiteIdProp } from '../common/props';
import { crispApiCall } from '../common/client';

export const updateConversationStateAction = createAction({
	auth: crispAuth,
	name: 'change_state',
	displayName: 'Change Conversation State',
	description: 'Updates the state of a conversation.',
	audience: 'both',
	aiMetadata: { description: 'Sets the workflow state of a Crisp conversation (unresolved, resolved, or pending), identified by website ID and conversation session ID. Use to mark a thread resolved or reopen it. Idempotent: re-applying the same target state leaves the conversation in that state with no extra effect.', idempotent: true },
	props: {
		websiteId: websiteIdProp,
		sessionId: sessionIdProp,
		state: Property.StaticDropdown({
			displayName: 'State',
			required: true,
			options: {
				options: [
					{ label: 'Unresolved', value: 'unresolved' },
					{ label: 'Resolved', value: 'resolved' },
					{ label: 'Pending', value: 'pending' },
				],
			},
		}),
	},
	async run(context) {
		const { websiteId, sessionId, state } = context.propsValue;

		const response = await crispApiCall({
			auth: context.auth,
			method: HttpMethod.PATCH,
			resourceUri: `/website/${websiteId}/conversation/${sessionId}/state`,
			body: {
				state,
			},
		});

		return response;
	},
});
