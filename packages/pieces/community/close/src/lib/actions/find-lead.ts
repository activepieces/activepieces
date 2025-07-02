import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMSearchQuery } from '../common/types';
import { closeApiCall } from '../common/client';

export const findLead = createAction({
	auth: closeAuth,
	name: 'find_lead',
	displayName: 'Find Lead',
	description: 'Search for leads with advanced filtering options',
	props: {
		search_type: Property.StaticDropdown({
			displayName: 'Search Type',
			required: true,
			options: {
				options: [
					{ label: 'By Name', value: 'name' },
					{ label: 'By Contact Email', value: 'contact_email' },
					{ label: 'By Status', value: 'status' },
				],
			},
		}),
		search_query: Property.ShortText({
			displayName: 'Search Query',
			required: true,
		}),
		match_type: Property.StaticDropdown({
			displayName: 'Match Type',
			required: false,
			options: {
				options: [
					{ label: 'Contains', value: 'contains' },
					{ label: 'Exact Match', value: 'exact' },
					{ label: 'Starts With', value: 'starts' },
					{ label: 'Ends With', value: 'ends' },
				],
			},
			defaultValue: 'contains',
		}),
	},
	async run(context) {
		const { search_type, search_query, match_type } = context.propsValue;

		try {
			// Build the search query
			const searchQuery = buildLeadSearchQuery({
				search_type,
				search_query,
				match_type: match_type || 'contains',
			});

			let cursor: string | undefined;

			const result = [];

			do {
				const response = await closeApiCall<{
					cursor?: string;
					data: Record<string, any>[];
				}>({
					accessToken: context.auth,
					method: HttpMethod.POST,
					resourceUri: '/data/search/',
					body: {
						_limit: 100,
						cursor,
						...searchQuery,
					},
				});

				const { data } = response;
				if (!data || data.length === 0) break;

				result.push(...data);
				cursor = response.cursor;
			} while (cursor);

			return {
				found: result.length > 0,
				result,
			};
		} catch (error: any) {
			if (error.response?.status === 400) {
				throw new Error(`Invalid search query: ${error.response.body?.error || 'Unknown error'}`);
			}
			if (error.response?.status === 401) {
				throw new Error('Authentication failed. Please check your API key.');
			}
			if (error.response?.status === 404) {
				throw new Error('No leads found matching your criteria.');
			}
			throw new Error(`Failed to search leads: ${error.message}`);
		}
	},
});

// Helper function to build the lead search query
function buildLeadSearchQuery(params: {
	search_type: string;
	search_query: string;
	match_type: string;
	custom_field_name?: string;
}): CloseCRMSearchQuery {
	const { search_type, search_query, match_type, custom_field_name } = params;

	const baseQuery = {
		type: 'object_type',
		object_type: 'lead',
	};

	let fieldCondition;

	switch (search_type) {
		case 'name':
			fieldCondition = {
				type: 'field_condition',
				field: {
					type: 'regular_field',
					object_type: 'lead',
					field_name: 'name',
				},
				condition: {
					type: 'text',
					mode: 'full_words',
					value: search_query,
				},
			};
			break;

		case 'contact_email':
			fieldCondition = {
				type: 'has_related',
				this_object_type: 'lead',
				related_object_type: 'contact',
				related_query: {
					type: 'has_related',
					this_object_type: 'contact',
					related_object_type: 'contact_email',
					related_query: {
						type: 'field_condition',
						field: {
							type: 'regular_field',
							object_type: 'contact_email',
							field_name: 'email',
						},
						condition: {
							type: 'text',
							mode: 'phrase',
							value: search_query,
						},
					},
				},
			};
			break;

		case 'status':
			fieldCondition = {
				type: 'field_condition',
				field: {
					type: 'regular_field',
					object_type: 'lead',
					field_name: 'status_label',
				},
				condition: {
					type: 'text',
					mode: 'phrase',
					value: search_query,
				},
			};
			break;

		case 'custom_field':
			fieldCondition = {
				type: 'field_condition',
				field: {
					type: 'regular_field',
					object_type: 'lead',
					field_name: custom_field_name!,
				},
				condition: {
					type: 'text',
					mode: 'full_words',
					value: search_query,
				},
			};
			break;

		default:
			throw new Error(`Unsupported search type: ${search_type}`);
	}

	return {
		query: {
			type: 'and',
			queries: [baseQuery, fieldCondition],
		},
		_fields: {
			lead: ['id', 'name', 'status_label', 'contacts'],
			contact: ['id', 'name', 'emails', 'phones'],
		},
	};
}
