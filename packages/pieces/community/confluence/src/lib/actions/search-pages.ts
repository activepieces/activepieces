import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';

type CqlSearchResponse = {
	results: unknown[];
	size: number;
	start: number;
	limit: number;
	totalSize?: number;
	_links?: { next?: string };
};

export const searchPagesAction = createAction({
	auth: confluenceAuth,
	name: 'search-pages',
	displayName: 'Search Content (CQL)',
	description:
		'Search Confluence content with CQL (Confluence Query Language). Example: `type = "page" AND space = "DOCS" AND title ~ "release"`.',
	props: {
		cql: Property.LongText({
			displayName: 'CQL',
			description:
				'Confluence Query Language expression. See https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/',
			required: true,
			defaultValue: 'type = "page" ORDER BY lastmodified DESC',
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			required: true,
			defaultValue: 25,
		}),
		expand: Property.ShortText({
			displayName: 'Expand',
			description:
				'Comma-separated list of properties to expand (e.g. `body.storage,version,space,history`).',
			required: false,
		}),
	},
	async run(context) {
		const { cql, maxResults, expand } = context.propsValue;

		await propsValidation.validateZod(context.propsValue, {
			maxResults: z.number().min(1).max(1000),
		});

		const all: unknown[] = [];
		let start = 0;
		const pageSize = 50;

		while (all.length < maxResults) {
			const limit = Math.min(pageSize, maxResults - all.length);
			const response = await confluenceApiCall<CqlSearchResponse>({
				domain: context.auth.props.confluenceDomain,
				username: context.auth.props.username,
				password: context.auth.props.password,
				method: HttpMethod.GET,
				version: 'v1',
				resourceUri: '/content/search',
				query: {
					cql,
					start: String(start),
					limit: String(limit),
					...(expand ? { expand } : {}),
				},
			});

			all.push(...response.results);
			if (response.results.length < limit || !response._links?.next) break;
			start += response.results.length;
		}

		return { results: all, count: all.length };
	},
});
