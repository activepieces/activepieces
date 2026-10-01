import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { listOwnersOutputSchema } from '../output-schemas';

export const listOwnersAction = createAction({
	auth: hubspotAuth,
	name: 'list_owners',
	classification: 'SEARCH',
	displayName: 'List Owners',
	description: 'Lists the CRM owners in the account.',
	audience: 'ai',
	outputSchema: listOwnersOutputSchema,
	aiMetadata: {
		description:
			'Lists the CRM owners (users records can be assigned to), returning each owner id, email and name. Use it to resolve an owner id when only a person name is known, or to enumerate who exists; use Get Owner by Email when the email is already known, which is the cheaper lookup. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Return only the owner with this email. Omit to list all owners.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of owners to return per page.',
			required: false,
		}),
		after: Property.ShortText({
			displayName: 'After',
			description: 'Paging cursor returned by a previous call; omit for the first page.',
			required: false,
		}),
	},
	async run(context) {
		const { email, limit, after } = context.propsValue;

		const queryParams: Record<string, string> = {};
		if (email !== undefined && email !== '') {
			queryParams['email'] = email;
		}
		if (limit !== undefined) {
			queryParams['limit'] = String(limit);
		}
		if (after !== undefined && after !== '') {
			queryParams['after'] = after;
		}

		const response = await httpClient.sendRequest<{
			results: Array<Record<string, unknown>>;
			paging?: Record<string, unknown>;
		}>({
			method: HttpMethod.GET,
			url: 'https://api.hubapi.com/crm/v3/owners',
			queryParams,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const owners = response.body.results ?? [];
		return { owners, count: owners.length, paging: response.body.paging ?? null };
	},
});
