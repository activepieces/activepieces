import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { searchKnowledgeArticlesOutputSchema } from '../../output-schemas';

export const searchKnowledgeArticles = createAction({
	auth: salesforceAuth,
	name: 'search_knowledge_articles',
	classification: 'SEARCH',
	displayName: 'Search Knowledge Articles',
	description: 'Search published Salesforce Knowledge articles by keyword.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches published Salesforce Knowledge articles by keyword in one language and returns titles, summaries and ids. Use it to answer support questions from the knowledge base; the id is the KnowledgeArticle id, not an article version id. Requires Knowledge enabled and a Knowledge User license on the connected user; page size defaults to 20, max 100. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: searchKnowledgeArticlesOutputSchema,
	props: {
		query: Property.ShortText({
			displayName: 'Search Text',
			required: true,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'Article language locale, e.g. en-US.',
			required: false,
			defaultValue: 'en-US',
		}),
		channel: Property.StaticDropdown({
			displayName: 'Channel',
			required: false,
			options: {
				options: [
					{ label: 'Internal App', value: 'App' },
					{ label: 'Public Knowledge Base', value: 'Pkb' },
					{ label: 'Customer', value: 'Csp' },
					{ label: 'Partner', value: 'Prm' },
				],
			},
		}),
		page_size: Property.Number({
			displayName: 'Page Size',
			description: 'Articles to return (default 20, max 100).',
			required: false,
			defaultValue: 20,
		}),
	},
	async run(context) {
		const query = context.propsValue.query.trim();
		if (!query) {
			throw new Error('Search Text must not be empty.');
		}
		const language = context.propsValue.language?.trim() || 'en-US';
		if (!/^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/.test(language)) {
			throw new Error('Language must be a locale such as en-US.');
		}
		const pageSize = Math.min(Math.max(Math.floor(context.propsValue.page_size ?? 20), 1), 100);
		const params = new URLSearchParams({
			q: query,
			pageSize: String(pageSize),
			...(context.propsValue.channel ? { channel: context.propsValue.channel } : {}),
		});
		const response = await callSalesforceApi(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/support/knowledgeArticles?${params.toString()}`,
			undefined,
			{ headers: { 'Accept-Language': language } }
		);
		const body: unknown = response.body;
		const articles = (salesforceUtils.isRecord(body) && Array.isArray(body['articles']) ? body['articles'] : [])
			.filter(salesforceUtils.isRecord)
			.map((article) => ({
				id: article['id'] ?? null,
				article_number: article['articleNumber'] ?? null,
				title: article['title'] ?? null,
				summary: article['summary'] ?? null,
				url_name: article['urlName'] ?? null,
				last_published_date: article['lastPublishedDate'] ?? null,
				view_count: article['viewCount'] ?? null,
			}));
		return { articles, count: articles.length };
	},
});
