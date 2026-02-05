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
