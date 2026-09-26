import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listActivitiesActionOutputSchema } from '../output-schemas';

export const listActivitiesAction = createAction({
	auth: pipedriveAuth,
	name: 'list-activities',
	outputSchema: listActivitiesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Activities',
	description: 'Lists one page of activities, optionally filtered.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one bounded page of activities filtered by deal, lead, person, organization, owner, done state or update time; pass next_cursor back as Cursor for the next page. Use this to see what is scheduled or done for a record; Find Activity instead does an exact match on one chosen field. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		dealId: Property.Number({
			displayName: 'Deal ID',
			description: 'Only activities linked to this deal ID (from Search Deals).',
			required: false,
		}),
		leadId: Property.ShortText({
			displayName: 'Lead ID',
			description: 'Only activities linked to this lead ID, a UUID (from Find Lead).',
			required: false,
		}),
		personId: Property.Number({
			displayName: 'Person ID',
			description: 'Only activities linked to this person ID (from Search Persons).',
			required: false,
		}),
		organizationId: Property.Number({
			displayName: 'Organization ID',
			description: 'Only activities linked to this organization ID (from Search Organizations).',
			required: false,
		}),
		ownerId: Property.Number({
			displayName: 'Owner ID',
			description: 'Only activities owned by this user ID (from List Users).',
			required: false,
		}),
		done: Property.StaticDropdown<boolean>({
			displayName: 'Done',
			description: 'Yes for completed activities only, No for pending only. Leave empty for both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
		updatedSince: Property.DateTime({
			displayName: 'Updated Since',
			description: 'Only activities updated at or after this time.',
			required: false,
		}),
		updatedUntil: Property.DateTime({
			displayName: 'Updated Until',
			description: 'Only activities updated before this time.',
			required: false,
		}),
		sortBy: Property.StaticDropdown<string>({
			displayName: 'Sort By',
			description: 'Field to sort by. Defaults to ID.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ID', value: 'id' },
					{ label: 'Update Time', value: 'update_time' },
					{ label: 'Add Time', value: 'add_time' },
					{ label: 'Due Date', value: 'due_date' },
				],
			},
		}),
		sortDirection: pipedriveAtomic.sortDirectionProp(),
		...pipedriveAtomic.paginationProps(),
	},
	async run(context) {
		const props = context.propsValue;
		const response = await pipedriveAtomic.call<V2ListResponse<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/v2/activities',
			resourceLabel: 'activities',
			query: {
				deal_id: props.dealId,
				lead_id: pipedriveAtomic.emptyToUndefined(props.leadId),
				person_id: props.personId,
				org_id: props.organizationId,
				owner_id: props.ownerId,
				done: props.done,
				updated_since: pipedriveAtomic.toRfc3339({ value: props.updatedSince, label: 'Updated Since' }),
				updated_until: pipedriveAtomic.toRfc3339({ value: props.updatedUntil, label: 'Updated Until' }),
				sort_by: props.sortBy,
				sort_direction: props.sortDirection,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.toPage(response);
	},
});
