import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { listStaticListsOutputSchema } from '../output-schemas';

export const listStaticListsAction = createAction({
	auth: hubspotAuth,
	name: 'list_static_lists',
	classification: 'SEARCH',
	displayName: 'List Lists',
	description: 'Lists the contact lists in the account.',
	audience: 'ai',
	outputSchema: listStaticListsOutputSchema,
	aiMetadata: {
		description:
			'Lists the contact lists in the account, returning each list id and name. Use it to turn a list name such as "Newsletter" into the list id that Add Contact To List and Remove Contact From List require, which is otherwise impossible to discover. An optional query filters by name. Note that each entry identifies the list as listId rather than id. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		query: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Filter lists whose name contains this text. Omit to list all.',
			required: false,
		}),
		count: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of lists to return (HubSpot defaults to 20).',
			required: false,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Offset returned by a previous call; omit for the first page.',
			required: false,
		}),
	},
	async run(context) {
		const { query, count, offset } = context.propsValue;

		const body: Record<string, unknown> = {};
		if (query !== undefined && query !== '') {
			body['query'] = query;
		}
		if (count !== undefined) {
			body['count'] = count;
		}
		if (offset !== undefined) {
			body['offset'] = offset;
		}

		const response = await httpClient.sendRequest<{
			lists: Array<Record<string, unknown>>;
			total: number;
			offset: number;
			hasMore: boolean;
		}>({
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/crm/v3/lists/search',
			body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const { lists, total, offset: nextOffset, hasMore } = response.body;
		return {
			lists: lists ?? [],
			total,
			offset: nextOffset,
			hasMore,
		};
	},
});
