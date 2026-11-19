import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { ListBasicPostsResponse, ListCommunityMembersResponse, ListSpacesResponse } from './types';
import { circleAuth } from './auth';

export const BASE_URL = 'https://app.circle.so/api/admin/v2';

export const spaceIdDropdown = Property.Dropdown({
	displayName: 'Space',
	description: 'The space in your community.',
	required: true,
	refreshers: [],
	auth: circleAuth,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first',
				options: [],
			};
		}
		try {
			const spaces = await fetchAllRecords<ListSpacesResponse['records'][number]>({
				auth,
				path: '/spaces',
				queryParams: {},
			});
			return {
				disabled: false,
				options: spaces.map((space) => ({
					label: space.name,
					value: space.id,
				})),
			};
		} catch {
			return {
				disabled: true,
				placeholder: 'Could not load spaces. Check your connection.',
				options: [],
			};
		}
	},
});

export const postIdDropdown = Property.Dropdown({
	displayName: 'Post',
	description: 'A post in the selected space.',
	required: true,
	refreshers: ['space_id'],
	auth: circleAuth,
	options: async ({ auth, space_id }) => {
		if (!auth || !space_id) {
			return {
				disabled: true,
				placeholder: !auth ? 'Please connect your account first' : 'Select a space first',
				options: [],
			};
		}
		try {
			const posts = await fetchAllRecords<ListBasicPostsResponse['records'][number]>({
				auth,
				path: '/posts',
				queryParams: {
					space_id: String(space_id),
					status: 'all',
					sort: 'latest',
				},
			});
			if (posts.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No posts found in this space.',
				};
			}
			return {
				disabled: false,
				options: posts.map((post) => ({
					label: post.name,
					value: post.id,
				})),
			};
		} catch {
			return {
				disabled: true,
				placeholder: 'Could not load posts. Check your connection.',
				options: [],
			};
		}
	},
});

export const communityMemberIdDropdown = Property.Dropdown({
	displayName: 'Member',
	description: 'A member of your community.',
	required: true,
	refreshers: [],
	auth: circleAuth,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first',
				options: [],
			};
		}
		try {
			const members = await fetchAllRecords<ListCommunityMembersResponse['records'][number]>({
				auth,
				path: '/community_members',
				queryParams: { status: 'all' },
			});
			return {
				disabled: false,
				options: members.map((member) => ({
					label: `${member.name} (${member.email})`,
					value: member.id,
				})),
			};
		} catch {
			return {
				disabled: true,
				placeholder: 'Could not load members. Check your connection.',
				options: [],
			};
		}
	},
});

async function fetchAllRecords<TRecord>({
	auth,
	path,
	queryParams,
	page = 1,
}: {
	auth: AppConnectionValueForAuthProperty<typeof circleAuth>;
	path: string;
	queryParams: QueryParams;
	page?: number;
}): Promise<TRecord[]> {
	const response = await httpClient.sendRequest<{
		records?: TRecord[];
		has_next_page?: boolean;
	}>({
		method: HttpMethod.GET,
		url: `${BASE_URL}${path}`,
		headers: {
			Authorization: `Bearer ${auth.secret_text}`,
			'Content-Type': 'application/json',
		},
		queryParams: {
			...queryParams,
			page: String(page),
			per_page: '100',
		},
	});
	const records = response.body.records ?? [];
	if (!response.body.has_next_page || page >= MAX_PAGES) {
		return records;
	}
	const nextRecords = await fetchAllRecords<TRecord>({
		auth,
		path,
		queryParams,
		page: page + 1,
	});
	return [...records, ...nextRecords];
}

const MAX_PAGES = 10;
