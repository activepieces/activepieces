import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { listPipelineStagesOutputSchema } from '../output-schemas';

export const listPipelineStagesAction = createAction({
	auth: hubspotAuth,
	name: 'list_pipeline_stages',
	classification: 'READ',
	displayName: 'List Pipeline Stages',
	description: 'Lists the stages of one pipeline.',
	audience: 'ai',
	outputSchema: listPipelineStagesOutputSchema,
	aiMetadata: {
		description:
			'Lists the stages of a single pipeline, returning each stage id and label in display order. Use it to turn a stage name such as "Closed Won" into the stage id that creating or moving a deal requires. List Pipelines already returns these stages inline, so prefer this only when the pipeline id is already known and refetching every pipeline would be wasteful. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		objectType: Property.StaticDropdown({
			displayName: 'Object Type',
			description: 'Which kind of pipeline the stages belong to.',
			required: true,
			defaultValue: 'deals',
			options: {
				options: [
					{ label: 'Deals', value: 'deals' },
					{ label: 'Tickets', value: 'tickets' },
				],
			},
		}),
		pipelineId: Property.ShortText({
			displayName: 'Pipeline ID',
			description: 'The pipeline id, as returned by List Pipelines.',
			required: true,
		}),
	},
	async run(context) {
		const { objectType, pipelineId } = context.propsValue;

		const response = await httpClient.sendRequest<{
			results: Array<Record<string, unknown>>;
		}>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/crm/v3/pipelines/${objectType}/${pipelineId}/stages`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const stages = response.body.results ?? [];
		return { stages, count: stages.length };
	},
});
