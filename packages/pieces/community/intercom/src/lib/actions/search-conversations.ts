import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import {
	buildSearchQuery,
	dateFilters,
	SearchQuery,
	searchRecords,
} from '../common/lookups';
import { searchConversationsOutputSchema } from '../output-schemas';

export const searchConversationsAction = createAction({
	auth: intercomAuth,
	name: 'search_conversations',
	classification: 'SEARCH',
	displayName: 'Search Conversations',
	description: 'Finds conversations by state, assignee, contact, tag, text or date.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Finds conversations by state, assigned admin or team, contact, tag, author email, words in the first message or subject, and created/updated dates, one page at a time. Returns conversations without their replies; use Get Conversation (by ID) for the messages. Read-only.',
		idempotent: true,
	},
	props: {
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Closed', value: 'closed' },
					{ label: 'Snoozed', value: 'snoozed' },
				],
			},
		}),
		adminAssigneeId: Property.ShortText({ displayName: 'Assigned Admin ID', required: false }),
		teamAssigneeId: Property.ShortText({ displayName: 'Assigned Team ID', required: false }),
		contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
		tagId: Property.ShortText({ displayName: 'Tag ID', required: false }),
		authorEmail: Property.ShortText({ displayName: 'Author Email', required: false }),
		bodyContains: Property.ShortText({
			displayName: 'First Message Contains',
			description: 'Intercom matches single words of the first message best.',
			required: false,
		}),
		subjectContains: Property.ShortText({ displayName: 'Subject Contains', required: false }),
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
	outputSchema: searchConversationsOutputSchema,
	async run(context) {
		const p = context.propsValue;
		const filters: SearchQuery[] = [
			...(p.state ? [{ field: 'state', operator: '=', value: p.state }] : []),
			...stringFilter({ field: 'admin_assignee_id', operator: '=', value: p.adminAssigneeId }),
			...stringFilter({ field: 'team_assignee_id', operator: '=', value: p.teamAssigneeId }),
			...stringFilter({ field: 'contact_ids', operator: '=', value: p.contactId }),
			...stringFilter({ field: 'tag_ids', operator: '=', value: p.tagId }),
			...stringFilter({ field: 'source.author.email', operator: '=', value: p.authorEmail }),
			...stringFilter({ field: 'source.body', operator: '~', value: p.bodyContains }),
			...stringFilter({ field: 'source.subject', operator: '~', value: p.subjectContains }),
			...dateFilters({ field: 'created_at', after: p.createdAfter, before: p.createdBefore }),
			...dateFilters({ field: 'updated_at', after: p.updatedAfter, before: p.updatedBefore }),
		];
		const query = buildSearchQuery({
			filters,
			advancedQuery: p.advancedQuery,
			fallback: { field: 'created_at', operator: '>', value: 0 },
		});
		return searchRecords({ auth: context.auth, resource: 'conversations', query, perPage: p.perPage, startingAfter: p.startingAfter });
	},
});

function stringFilter({
	field,
	operator,
	value,
}: {
	field: string;
	operator: string;
	value: string | undefined;
}): SearchQuery[] {
	return value?.trim() ? [{ field, operator, value: value.trim() }] : [];
}
