import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const createListAction = createAction({
	auth: klaviyoAuth,
	name: 'create-list',
	displayName: 'Create List',
	description: 'Creates a new subscriber list in Klaviyo.',
	props: {
		name: Property.ShortText({
			displayName: 'List Name',
			required: true,
			description: 'A helpful name to label the list.',
		}),
	},
	async run({ auth, propsValue }) {
		const { name } = propsValue;

		const body = {
			data: {
				type: 'list',
				attributes: {
					name,
				},
			},
		};

		const response = await klaviyoApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: '/lists',
			body,
		});

		return response;
	},
});
