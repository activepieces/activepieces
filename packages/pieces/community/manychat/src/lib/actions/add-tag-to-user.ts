import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { manychatAuth } from '../../index';
import { BASE_URL, subscriberId, tagIdDropdown } from '../common/props';

export const addTagToUserAction = createAction({
	auth: manychatAuth,
	name: 'addTagToUser',
	displayName: 'Add Tag to User',
	description: 'Adds a tag to a user.',
	props: {
		subscriberId: subscriberId,
		tagId: tagIdDropdown,
	},
	async run({ auth, propsValue }) {
		const { subscriberId, tagId } = propsValue;

		const addTagResponse = await httpClient.sendRequest<{ status: string }>({
			url: `${BASE_URL}/subscriber/addTag`,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			body: {
				subscriber_id: subscriberId,
				tag_id: tagId,
			},
		});

		if (addTagResponse.body.status !== 'success') {
			throw Error(`Unexpected Error occured : ${JSON.stringify(addTagResponse.body)}`);
		}

		const userResponse = await httpClient.sendRequest<{ data: Record<string, any> }>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/subscriber/getInfo`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			queryParams: {
				subscriber_id: `${subscriberId}`,
			},
		});

		return userResponse.body.data;
	},
});
