import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { circleAuth } from '../common/auth';
import { BASE_URL, spaceIdDropdown } from '../common';

interface AddMemberToSpacePayload {
	space_id: number;
	email: string;
}

export const addMemberToSpace = createAction({
	auth: circleAuth,
	name: 'add_member_to_space',
	displayName: 'Add Member to Space',
	description: 'Add an existing member to a specific space by their email.',
	props: {
		space_id: spaceIdDropdown,
		email: Property.ShortText({
			displayName: 'Member Email',
			description: 'The email address of the member to add to the space.',
			required: true,
		}),
	},
	async run(context) {
		const { space_id, email } = context.propsValue;

		if (space_id === undefined) {
			throw new Error('Space ID is undefined, but it is a required field.');
		}
		if (email === undefined) {
			throw new Error('Email is undefined, but it is a required field.');
		}

		const payload: AddMemberToSpacePayload = {
			space_id: space_id,
			email: email,
		};

		const response = await httpClient.sendRequest<{
			message?: string;
			success?: boolean;
			error_details?: unknown;
		}>({
			method: HttpMethod.POST,
			url: `${BASE_URL}/space_members`,
			body: payload,
			headers: {
				Authorization: `Bearer ${context.auth}`,
				'Content-Type': 'application/json',
			},
		});

		return response.body;
	},
});
