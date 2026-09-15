import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { searchObjectsOutputSchema } from '../output-schemas';

export const searchObjectsAction = createAction({
	auth: hubspotAuth,
	name: 'search_objects',
	classification: 'SEARCH',
	displayName: 'Search Objects',
	description: 'Searches any CRM object type with full filter, sort and paging support.',
	audience: 'ai',
	outputSchema: searchObjectsOutputSchema,
	aiMetadata: {
		description:
			'Searches any CRM object type using HubSpot\'s full filter syntax, which the Find actions cannot express. Filter Groups are OR-ed together and the filters inside one group are AND-ed, so "deals over 10000 OR closing this month" is two groups while "over 10000 AND closing this month" is one group with two filters. HubSpot allows at most 5 groups, 6 filters per group and 18 filters overall. Each operator takes a specific key and sending the wrong one is rejected: EQ, NEQ, LT, LTE, GT, GTE and CONTAINS_TOKEN take a single "value"; IN and NOT_IN take an array called "values"; BETWEEN takes "value" as the lower bound together with "highValue" as the upper bound; HAS_PROPERTY and NOT_HAS_PROPERTY take neither. EQ alone is what the Find actions already do, so prefer them for a simple lookup. Results are paged with a cursor returned as paging.next.after and capped at 200 per page, dates are ISO 8601 or epoch milliseconds, and only the properties asked for come back. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		objectType: Property.ShortText({
			displayName: 'Object Type',
			description: 'The object type to search, such as contacts, companies, deals, tickets, notes or tasks.',
			required: true,
		}),
		filterGroups: Property.Json({
			displayName: 'Filter Groups',
			description:
				'HubSpot filterGroups array. Groups are OR-ed, filters within a group are AND-ed. Max 5 groups, 6 filters per group, 18 filters overall. Each operator takes a different key: EQ, NEQ, LT, LTE, GT, GTE and CONTAINS_TOKEN use "value", for example {"propertyName":"amount","operator":"GT","value":"10000"}; IN and NOT_IN use "values" as an array, for example {"propertyName":"firstname","operator":"IN","values":["Ada","Grace"]}; BETWEEN uses "value" for the lower bound and "highValue" for the upper, for example {"propertyName":"createdate","operator":"BETWEEN","value":"1700000000000","highValue":"1800000000000"}; HAS_PROPERTY and NOT_HAS_PROPERTY take no value at all.',
			required: false,
		}),
		query: Property.ShortText({
			displayName: 'Text Query',
			description: 'Free-text search across the object default searchable properties.',
			required: false,
		}),
		properties: Property.Array({
			displayName: 'Properties To Return',
			description: 'Internal property names to include. Omit for HubSpot defaults; resolve names with List Object Properties.',
			required: false,
		}),
		sortPropertyName: Property.ShortText({
			displayName: 'Sort By Property',
			description: 'Internal property name to sort on, such as createdate.',
			required: false,
		}),
		sortDirection: Property.StaticDropdown({
			displayName: 'Sort Direction',
			required: false,
			defaultValue: 'DESCENDING',
			options: {
				options: [
					{ label: 'Descending', value: 'DESCENDING' },
					{ label: 'Ascending', value: 'ASCENDING' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Results per page, up to 200. HubSpot defaults to 10.',
			required: false,
		}),
		after: Property.ShortText({
			displayName: 'After',
			description: 'Paging cursor from a previous call (paging.next.after). Omit for the first page.',
			required: false,
		}),
	},
	async run(context) {
		const { objectType, filterGroups, query, properties, sortPropertyName, sortDirection, limit, after } =
			context.propsValue;

		const body: Record<string, unknown> = {};
		if (filterGroups !== undefined && filterGroups !== null) {
			body['filterGroups'] = filterGroups;
		}
		if (query !== undefined && query !== '') {
			body['query'] = query;
		}
		if (properties !== undefined && properties.length > 0) {
			body['properties'] = properties.map((property) => String(property));
		}
		if (sortPropertyName !== undefined && sortPropertyName !== '') {
			body['sorts'] = [
				{
					propertyName: sortPropertyName,
					direction: sortDirection ?? 'DESCENDING',
				},
			];
		}
		if (limit !== undefined) {
			body['limit'] = limit;
		}
		if (after !== undefined && after !== '') {
			body['after'] = after;
		}

		const response = await httpClient.sendRequest<{
			total: number;
			results: Array<Record<string, unknown>>;
			paging?: Record<string, unknown>;
		}>({
			method: HttpMethod.POST,
			url: `https://api.hubapi.com/crm/v3/objects/${objectType}/search`,
			body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
		});

		const { total, results, paging } = response.body;
		return { total, results: results ?? [], paging: paging ?? null };
	},
});
