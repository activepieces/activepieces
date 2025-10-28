import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ListBasicPostsResponse, ListCommunityMembersResponse, ListSpacesResponse } from './types';

export const BASE_URL = 'https://app.circle.so/api/admin/v2';

export const spaceIdDropdown = Property.Dropdown<number>({
	displayName: 'Space',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first',
				options: [],
			};
		}
		const response = await httpClient.sendRequest<ListSpacesResponse>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/spaces`,
			headers: {
				Authorization: `Bearer ${auth as string}`,
				'Content-Type': 'application/json',
			},
		});
		if (response.status === 200) {
			return {
				disabled: false,
				options: response.body.records.map((space) => ({
					label: space.name,
					value: space.id,
				})),
			};
		}
		return {
			disabled: true,
			placeholder: 'Error fetching spaces',
			options: [],
		};
	},
});

export const postIdDropdown = Property.Dropdown<number>({
	displayName: 'Post',
	required: true,
	refreshers: ['space_id'],
	options: async ({ auth, space_id }) => {
		if (!auth || !space_id) {
			return {
				disabled: true,
				placeholder: !auth ? 'Please connect your account first' : 'Select a space first',
				options: [],
			};
		}
		const response = await httpClient.sendRequest<ListBasicPostsResponse>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/posts`,
			headers: {
				Authorization: `Bearer ${auth as string}`,
				'Content-Type': 'application/json',
			},
			queryParams: {
				space_id: (space_id as number).toString(),
				status: 'all', // Fetch all posts for selection
			},
		});
		if (response.status === 200) {
			return {
				disabled: false,
				options: response.body.records.map((post) => ({
					label: post.name,
					value: post.id,
				})),
			};
		}
		return {
			disabled: true,
			placeholder: 'Error fetching posts or no posts found in space.',
			options: [],
		};
	},
});

export const communityMemberIdDropdown = Property.Dropdown<number>({
	displayName: 'Community Member',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, placeholder: 'Please authenticate first', options: [] };
		}
		const response = await httpClient.sendRequest<ListCommunityMembersResponse>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/community_members`,
			headers: {
				Authorization: `Bearer ${auth as string}`,
				'Content-Type': 'application/json',
			},
			queryParams: { status: 'all' },
		});
		if (response.status === 200 && response.body.records) {
			return {
				disabled: false,
				options: response.body.records.map((member) => ({
					label: `${member.name} (${member.email})`,
					value: member.id,
				})),
			};
		}
		return {
			disabled: true,
			placeholder: 'Error fetching community members or no members found',
			options: [],
		};
	},
});
