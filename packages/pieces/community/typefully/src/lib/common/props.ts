import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyApiCall } from './client';
import { typefullyAuth } from '../auth';
import {
	TypefullyPaginatedResponse,
	TypefullySocialSet,
	TypefullyTag,
} from './types';

export const socialSetDropdown = Property.Dropdown({
	auth: typefullyAuth,
	displayName: 'Social Set',
	description: 'The social set (account) to use.',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const response = await typefullyApiCall<
			TypefullyPaginatedResponse<TypefullySocialSet>
		>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/social-sets',
			query: { limit: 50 },
		});

		return {
			disabled: false,
			options: response.results.map((socialSet) => ({
				label: socialSet.name,
				value: socialSet.id,
			})),
		};
	},
});

export const tagsMultiSelectDropdown = Property.MultiSelectDropdown({
	auth: typefullyAuth,
	displayName: 'Tags',
	description: 'Tags to apply to the draft.',
	refreshers: ['social_set_id'],
	required: false,
	options: async ({ auth, social_set_id }) => {
		if (!auth || !social_set_id) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account and select a social set first.',
			};
		}

		const response = await typefullyApiCall<
			TypefullyPaginatedResponse<TypefullyTag>
		>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/social-sets/${social_set_id}/tags`,
			query: { limit: 50 },
		});

		return {
			disabled: false,
			options: response.results.map((tag) => ({
				label: tag.name,
				value: tag.id,
			})),
		};
	},
});
