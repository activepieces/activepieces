import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createMessageReply = createAction({
	name: 'create_message_reply',
	displayName: 'Create Message Reply',
	description: 'Post a reply in a message thread.',
	auth: teamworkAuth,
	props: {
		messageId: Property.Dropdown({
			displayName: 'Message',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/posts.json',
				});
				const options = res.data.posts.map((p: { id: string; title: string }) => ({
					label: p.title,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		body: Property.LongText({
			displayName: 'Body',
			required: true,
		}),
		notify: Property.Checkbox({
			displayName: 'Notify All',
			description: 'Notify all project users of this reply.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = {
			messagereply: {
				body: propsValue.body,
				notify: propsValue.notify ? 'All' : undefined,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/messages/${propsValue.messageId}/messageReplies.json`,
			body,
		});
	},
});


