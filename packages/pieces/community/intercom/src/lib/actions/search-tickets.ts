import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import {
	buildSearchQuery,
	dateFilters,
	SearchQuery,
	searchRecords,
} from '../common/lookups';
import { searchTicketsOutputSchema } from '../output-schemas';

export const searchTicketsAction = createAction({
	auth: intercomAuth,
	name: 'search_tickets',
	classification: 'SEARCH',
	displayName: 'Search Tickets',
	description: 'Finds tickets by type, state, contact, assignee, title or date.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds tickets by ticket type, state, open flag, contact, assigned admin, words in the title and created/updated dates, one page at a time; pass next_starting_after to continue. Read-only.',
		idempotent: true,
	},
	props: {
		ticketTypeId: Property.ShortText({ displayName: 'Ticket Type ID', required: false }),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Submitted', value: 'submitted' },
					{ label: 'In Progress', value: 'in_progress' },
					{ label: 'Waiting on Customer', value: 'waiting_on_customer' },
					{ label: 'Resolved', value: 'resolved' },
				],
			},
		}),
		open: Property.StaticDropdown({
			displayName: 'Open or Closed',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Closed', value: 'closed' },
				],
			},
		}),
		contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
		adminAssigneeId: Property.ShortText({ displayName: 'Assigned Admin ID', required: false }),
		titleContains: Property.ShortText({ displayName: 'Title Contains', required: false }),
		createdAfter: Property.DateTime({
			displayName: 'Created After',
			description: 'Intercom compares dates by calendar day in your workspace time zone.',
			required: false,
		}),
		createdBefore: Property.DateTime({ displayName: 'Created Before', required: false }),
		updatedAfter: Property.DateTime({ displayName: 'Updated After', required: false }),
		updatedBefore: Property.DateTime({ displayName: 'Updated Before', required: false }),
		advancedQuery: Property.Json({
			displayName: 'Advanced Query',
			description: 'Optional Intercom search filter, combined with the fields above using AND.',
			required: false,
		}),
		perPage: Property.Number({ displayName: 'Results Per Page', description: '1 to 150. Default 50.', required: false }),
		startingAfter: Property.ShortText({
			displayName: 'Starting After',
			description: 'The next_starting_after value from the previous page.',
			required: false,
		}),
	},
	outputSchema: searchTicketsOutputSchema,
	async run(context) {
		const p = context.propsValue;
		const filters: SearchQuery[] = [
			...equalsFilter({ field: 'ticket_type_id', value: p.ticketTypeId }),
			...(p.state ? [{ field: 'state', operator: '=', value: p.state }] : []),
			...(p.open ? [{ field: 'open', operator: '=', value: p.open === 'open' }] : []),
			...equalsFilter({ field: 'contact_ids', value: p.contactId }),
			...equalsFilter({ field: 'admin_assignee_id', value: p.adminAssigneeId }),
			...(p.titleContains?.trim() ? [{ field: 'title', operator: '~', value: p.titleContains.trim() }] : []),
			...dateFilters({ field: 'created_at', after: p.createdAfter, before: p.createdBefore }),
			...dateFilters({ field: 'updated_at', after: p.updatedAfter, before: p.updatedBefore }),
		];
		const query = buildSearchQuery({
			filters,
			advancedQuery: p.advancedQuery,
			fallback: { field: 'created_at', operator: '>', value: 0 },
		});
		return searchRecords({ auth: context.auth, resource: 'tickets', query, perPage: p.perPage, startingAfter: p.startingAfter });
	},
});

function equalsFilter({ field, value }: { field: string; value: string | undefined }): SearchQuery[] {
	return value?.trim() ? [{ field, operator: '=', value: value.trim() }] : [];
}
