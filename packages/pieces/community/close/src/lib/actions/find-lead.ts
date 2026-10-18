import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../auth';
import { CloseCRMSearchQuery } from '../common/types';
import { CloseApiError, closeApiCall } from '../common/client';

export const findLead = createAction({
	auth: closeAuth,
	name: 'find_lead',
	classification: 'SEARCH',
	displayName: 'Find Lead',
	description: 'Search for leads with advanced filtering options',
	audience: 'human',
	aiMetadata: {
		description: 'Searches leads in Close CRM and returns all matching records (auto-paginated). The search type selects which field to match on — lead name, a related contact email, or status label — and the match mode controls how the query string is compared. Use to look up leads by a known attribute before creating or updating related records. Read-only and idempotent. Requires a search query value.',
		idempotent: true,
	},
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
					{ label: 'All Words (any order)', value: 'contains' },
					{ label: 'Exact Phrase', value: 'exact' },
					
				],
			},
			defaultValue: 'contains',
		}),
	},
	async run(context) {
		const { search_type, search_query, match_type } = context.propsValue;

		try {
			// Build the search query
			const statusIds =
				search_type === 'status'
					? await resolveLeadStatusIds({
							accessToken: context.auth.secret_text,
							label: search_query,
							exact: match_type === 'exact',
						})
					: [];
			if (search_type === 'status' && statusIds.length === 0) {
				return { found: false, result: [] };
			}
			const searchQuery = buildLeadSearchQuery({
				search_type,
				search_query,
				match_type: match_type || 'contains',
				status_ids: statusIds,
			});

			let cursor: string | undefined;

			const result = [];

			do {
				const response = await closeApiCall<{
					cursor?: string;
					data: Record<string, unknown>[];
				}>({
					accessToken: context.auth.secret_text,
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
		} catch (error) {
			if (error instanceof CloseApiError && error.status === 400) {
				throw new Error(`Invalid search query. ${error.message}`);
			}
			
			throw error;
		}
	},
});

async function resolveLeadStatusIds({ accessToken, label, exact }: { accessToken: string; label: string; exact: boolean }): Promise<string[]> {
	const response = await closeApiCall<{ data?: { id: string; label: string }[] }>({
		accessToken,
		method: HttpMethod.GET,
		resourceUri: '/status/lead/',
	});
	const wanted = label.trim().toLowerCase();
	return (response.data ?? [])
		.filter((status) => {
			const current = status.label.toLowerCase();
			return exact ? current === wanted : current.includes(wanted);
		})
		.map((status) => status.id);
}

function buildLeadSearchQuery(params: {
	search_type: string;
	search_query: string;
	match_type: string;
	custom_field_name?: string;
	status_ids?: string[];
}): CloseCRMSearchQuery {
	const { search_type, search_query, match_type, custom_field_name, status_ids } = params;
	const textMode = match_type === 'exact' ? 'phrase' : 'full_words';

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
					mode: textMode,
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
							mode: textMode,
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
					field_name: 'status_id',
				},
				condition: {
					type: 'reference',
					reference_type: 'status.lead',
					object_ids: status_ids ?? [],
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
					mode: textMode,
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
