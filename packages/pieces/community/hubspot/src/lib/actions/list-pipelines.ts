import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { listPipelinesOutputSchema } from '../output-schemas';

export const listPipelinesAction = createAction({
	auth: hubspotAuth,
	name: 'list_pipelines',
	classification: 'READ',
	displayName: 'List Pipelines',
	description: 'Lists the pipelines defined for deals or tickets.',
	audience: 'ai',
	outputSchema: listPipelinesOutputSchema,
	aiMetadata: {
		description:
			'Lists the pipelines defined for deals or tickets, returning each pipeline id and label together with its stages. Use it to turn a pipeline name such as "Sales Pipeline" into the pipeline id that creating or updating a deal or ticket requires; the stages come back inline, so a separate lookup is usually unnecessary. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		objectType: Property.StaticDropdown({
			displayName: 'Object Type',
			description: 'Which kind of pipeline to list.',
			required: true,
			defaultValue: 'deals',
			options: {
				options: [
					{ label: 'Deals', value: 'deals' },
					{ label: 'Tickets', value: 'tickets' },
				],
			},
		}),
	},
	async run(context) {
		const { objectType } = context.propsValue;

		const response = await httpClient.sendRequest<{
			results: Array<Record<string, unknown>>;
		}>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/crm/v3/pipelines/${objectType}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const pipelines = response.body.results ?? [];
		return { pipelines, count: pipelines.length };
	},
});
