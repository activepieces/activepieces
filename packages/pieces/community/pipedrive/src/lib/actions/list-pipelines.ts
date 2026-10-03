import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listPipelinesActionOutputSchema } from '../output-schemas';

export const listPipelinesAction = createAction({
	auth: pipedriveAuth,
	name: 'list-pipelines',
	outputSchema: listPipelinesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Pipelines',
	description: 'Lists the sales pipelines.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the sales pipelines with their IDs and names, one page at a time. Use it to turn a pipeline name into the Pipeline ID that deal filters, Create Deal and Convert Lead to Deal expect; use List Stages for the stages inside a pipeline. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
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
			resourceUri: '/v2/pipelines',
			resourceLabel: 'pipelines',
			query: {
				sort_by: props.sortBy,
				sort_direction: props.sortDirection,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.toPage(response);
	},
});
