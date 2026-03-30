import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyApiCall } from './client';
import { typefullyAuth } from '../auth';
import {
	TypefullyPaginatedResponse,
	TypefullySocialSet,
	TypefullyTag,
} from './types';

async function fetchAllPages<T>(
	apiKey: string,
	resourceUri: string,
): Promise<T[]> {
	const allResults: T[] = [];
	let offset = 0;
	const limit = 50;

	while (true) {
		const response = await typefullyApiCall<TypefullyPaginatedResponse<T>>({
			apiKey,
			method: HttpMethod.GET,
			resourceUri,
			query: { limit, offset },
		});

		allResults.push(...response.results);

		if (response.results.length < limit || response.next === null) break;
		offset += limit;
	}

	return allResults;
}

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

		const socialSets = await fetchAllPages<TypefullySocialSet>(
			auth.secret_text,
			'/social-sets',
		);

		return {
			disabled: false,
			options: socialSets.map((socialSet) => ({
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

		const tags = await fetchAllPages<TypefullyTag>(
			auth.secret_text,
			`/social-sets/${social_set_id}/tags`,
		);

		return {
			disabled: false,
			options: tags.map((tag) => ({
				label: tag.name,
				value: tag.id,
			})),
		};
	},
});
