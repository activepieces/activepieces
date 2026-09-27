import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listOrganizationsActionOutputSchema } from '../output-schemas';

export const listOrganizationsAction = createAction({
	auth: pipedriveAuth,
	name: 'list-organizations',
	outputSchema: listOrganizationsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Organizations',
	description: 'Lists one page of organizations, optionally filtered.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one bounded page of organizations filtered by owner or update time; pass next_cursor back as Cursor for the next page. Use Search Organizations to find one by name or address. Custom fields are keyed by field hash here; use Get Organization for named custom fields. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		ownerId: Property.Number({
			displayName: 'Owner ID',
			description: 'Only organizations owned by this user ID (from List Users).',
			required: false,
		}),
		updatedSince: Property.DateTime({
			displayName: 'Updated Since',
			description: 'Only organizations updated at or after this time.',
			required: false,
		}),
		updatedUntil: Property.DateTime({
			displayName: 'Updated Until',
			description: 'Only organizations updated before this time.',
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
			resourceUri: '/v2/organizations',
			resourceLabel: 'organizations',
			query: {
				owner_id: props.ownerId,
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
