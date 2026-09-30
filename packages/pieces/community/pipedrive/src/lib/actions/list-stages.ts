import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listStagesActionOutputSchema } from '../output-schemas';

export const listStagesAction = createAction({
	auth: pipedriveAuth,
	name: 'list-stages',
	outputSchema: listStagesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Stages',
	description: 'Lists pipeline stages.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists deal stages with their IDs, names and pipeline, optionally for one pipeline only, one page at a time. Use it to turn a stage name into the Stage ID that deal filters, Create Deal, Update Deal and Convert Lead to Deal expect. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		pipelineId: Property.Number({
			displayName: 'Pipeline ID',
			description: 'Only stages of this pipeline ID (from List Pipelines). Leave empty for all pipelines.',
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
					{ label: 'Order Number', value: 'order_nr' },
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
			resourceUri: '/v2/stages',
			resourceLabel: 'stages',
			query: {
				pipeline_id: props.pipelineId,
				sort_by: props.sortBy,
				sort_direction: props.sortDirection,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.toPage(response);
	},
});
