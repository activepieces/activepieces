import { createAction, Property } from '@activepieces/pieces-framework';

import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../common/auth';
import { websiteIdProp } from '../common/props';
import { crispApiCall } from '../common/client';
import { HttpStatusCode } from 'axios';

export const createConversationAction = createAction({
	auth: crispAuth,
	name: 'create_conversation',
	displayName: 'Create Conversation',
	description: 'Creates a new conversation.',
	props: {
		websiteId: websiteIdProp,
		email: Property.ShortText({
			displayName: 'Customer Email',
			required: true,
		}),
		username: Property.ShortText({
			displayName: 'Customer Username',
			required: true,
		}),
		messageFrom: Property.StaticDropdown({
			displayName: 'Message From',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'User', value: 'user' },
					{ label: 'Operator', value: 'operator' },
				],
			},
		}),
		message: Property.LongText({
			displayName: 'Message',
			required: true,
		}),
	},
	async run(context) {
		const { websiteId, message, messageFrom, email, username } = context.propsValue;

		// create user if doesn't exist
		try {
			await crispApiCall<{ data: Record<string, any> }>({
				auth: context.auth,
				method: HttpMethod.PUT,
				resourceUri: `/website/${websiteId}/people/profile/${email}`,
				body: {
					email,
					person: {
						nickname: username,
					},
				},
			});
		} catch (e) {
			const err = e as HttpError;
			if (err.response.status === HttpStatusCode.NotFound) {
				await crispApiCall({
					auth: context.auth,
					method: HttpMethod.POST,
					resourceUri: `/website/${websiteId}/people/profile`,
					body: {
						email,
						person: {
							nickname: username,
						},
					},
				});
			}
		}

		// create empty conversation
		const newConversationResponse = await crispApiCall<{ data: { session_id: string } }>({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/website/${websiteId}/conversation`,
			body: {},
		});

		// add text message in conversation
		await crispApiCall({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/website/${websiteId}/conversation/${newConversationResponse.data.session_id}/message`,
			body: {
				type: 'text',
				from: messageFrom,
				origin: 'chat',
				content: message,
			},
		});

		// update customer profile meta for conversation
		await crispApiCall({
			auth: context.auth,
			method: HttpMethod.PATCH,
			resourceUri: `/website/${websiteId}/conversation/${newConversationResponse.data.session_id}/meta`,
			body: {
				email,
				nickname:username
			},
		});



		const conversationResponse = await crispApiCall({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/website/${websiteId}/conversation/${newConversationResponse.data.session_id}`,
		});

		return conversationResponse;
	},
});
