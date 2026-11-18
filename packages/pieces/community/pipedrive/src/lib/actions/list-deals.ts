import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listDealsActionOutputSchema } from '../output-schemas';

export const listDealsAction = createAction({
	auth: pipedriveAuth,
	name: 'list-deals',
	outputSchema: listDealsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Deals',
	description: 'Lists one page of deals, optionally filtered.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one bounded page of deals filtered by owner, person, organization, pipeline, stage, status or update time; pass next_cursor back as Cursor for the next page. Prefer this over Find Deals Associated With Person, which fetches every deal of one person; use Search Deals to match by title text. Custom fields are keyed by field hash here; use Get Deal for named custom fields. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		ownerId: Property.Number({
			displayName: 'Owner ID',
			description: 'Only deals owned by this user ID (from List Users).',
			required: false,
		}),
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
		pipelineId: Property.Number({
			displayName: 'Pipeline ID',
			description: 'Only deals in this pipeline ID (from List Pipelines).',
			required: false,
		}),
		stageId: Property.Number({
			displayName: 'Stage ID',
			description: 'Only deals in this stage ID (from List Stages).',
			required: false,
		}),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			description: 'Only deals with this status. Leave empty for open, won and lost deals.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Won', value: 'won' },
					{ label: 'Lost', value: 'lost' },
					{ label: 'Deleted', value: 'deleted' },
				],
			},
		}),
		updatedSince: Property.DateTime({
			displayName: 'Updated Since',
			description: 'Only deals updated at or after this time.',
			required: false,
		}),
		updatedUntil: Property.DateTime({
			displayName: 'Updated Until',
			description: 'Only deals updated before this time.',
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
			resourceUri: '/v2/deals',
			resourceLabel: 'deals',
			query: {
				owner_id: props.ownerId,
				person_id: props.personId,
				org_id: props.organizationId,
				pipeline_id: props.pipelineId,
				stage_id: props.stageId,
				status: props.status,
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
