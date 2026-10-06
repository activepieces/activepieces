import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2SearchResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { searchDealsActionOutputSchema } from '../output-schemas';

export const searchDealsAction = createAction({
	auth: pipedriveAuth,
	name: 'search-deals',
	outputSchema: searchDealsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'Search Deals',
	description: 'Searches deals by title, notes or custom field text.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fuzzy text search over deal titles, notes and custom fields, ranked by relevance, optionally narrowed to a person, organization or status; returns one page with next_cursor. Use this to find a deal by name; Find Deal instead does an exact match on one chosen field. The term needs at least 2 characters (1 with Exact Match). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		term: Property.ShortText({
			displayName: 'Search Term',
			description: 'Text to search for. At least 2 characters, or 1 when Exact Match is Yes.',
			required: true,
		}),
		fields: Property.StaticMultiSelectDropdown<string>({
			displayName: 'Search In',
			description: 'Fields to search. Leave empty to search all of them.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Title', value: 'title' },
					{ label: 'Notes', value: 'notes' },
					{ label: 'Custom Fields', value: 'custom_fields' },
				],
			},
		}),
		exactMatch: pipedriveAtomic.exactMatchProp(),
		personId: Property.Number({
			displayName: 'Person ID',
			description: 'Only deals linked to this person ID (from Search Persons).',
			required: false,
		}),
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description: 'Only deals linked to this organization ID (from Search Organizations).',
			required: false,
		}),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			description: 'Only deals with this status. Leave empty for any status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Won', value: 'won' },
					{ label: 'Lost', value: 'lost' },
				],
			},
		}),
		...pipedriveAtomic.paginationProps(),
	},
	async run(context) {
		const props = context.propsValue;
		const term = pipedriveAtomic.assertSearchTerm({ term: props.term, exactMatch: props.exactMatch });
		const response = await pipedriveAtomic.call<V2SearchResponse>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v2/deals/search',
			resourceLabel: 'deal search',
			query: {
				term,
				fields: props.fields && props.fields.length > 0 ? props.fields : undefined,
				exact_match: props.exactMatch,
				person_id: props.personId,
				organization_id: props.organizationId,
				status: props.status,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.flattenSearchItems(response);
	},
});
