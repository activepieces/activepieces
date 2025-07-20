import {
	createAction,
	Property,
	DynamicPropsValue,
	PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../..';
import { confluenceApiCall } from '../common';

interface ConfluencePage {
	id: string;
	title: string;
	body: any;
	children?: ConfluencePage[];
}

async function getPageWithContent(
	auth: PiecePropValueSchema<typeof confluenceAuth>,
	pageId: string,
): Promise<ConfluencePage> {
	try {
		const response = await confluenceApiCall<ConfluencePage>({
			domain: auth.confluenceDomain,
			username: auth.username,
			password: auth.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/pages/${pageId}`,
			query: {
				'body-format': 'storage',
			},
		});
		return response;
	} catch (error) {
		throw new Error(
			`Failed to fetch page ${pageId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
}

async function getChildPages(
	auth: PiecePropValueSchema<typeof confluenceAuth>,
	parentId: string,
	currentDepth: number,
	maxDepth: number,
): Promise<ConfluencePage[]> {
	if (currentDepth >= maxDepth) {
		return [];
	}

	try {
		const childrenResponse = await confluenceApiCall<{ results: ConfluencePage[] }>({
			domain: auth.confluenceDomain,
			username: auth.username,
			password: auth.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/pages/${parentId}/children`,
		});

		const childPages = await Promise.all(
			childrenResponse.results.map(async (childPage) => {
				const pageWithContent = await getPageWithContent(auth, childPage.id);
				const children = await getChildPages(auth, childPage.id, currentDepth + 1, maxDepth);
				return {
					...pageWithContent,
					children,
				};
			}),
		);

		return childPages;
	} catch (error) {
		throw new Error(
			`Failed to fetch children for page ${parentId}: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
		);
	}
}

export const getPageContent = createAction({
	name: 'getPageContent',
	displayName: 'Get Page Content',
	description: 'Get page content and optionally all its descendants',
	auth: confluenceAuth,
	props: {
		pageId: Property.ShortText({
			displayName: 'Page ID',
			description: 'Get this from the page URL of your Confluence Cloud',
			required: true,
		}),
		includeDescendants: Property.Checkbox({
			displayName: 'Include Descendants ?',
			description: 'If checked, will fetch all child pages recursively.',
			required: false,
			defaultValue: false,
		}),
		dynamic: Property.DynamicProperties({
			displayName: 'Dynamic Properties',
			refreshers: ['includeDescendants'],
			required: true,
			props: async ({ includeDescendants }) => {
				if (!includeDescendants) {
					return {};
				}
				const fields: DynamicPropsValue = {
					maxDepth: Property.Number({
						displayName: 'Maximum Depth',
						description: 'Maximum depth of child pages to fetch.',
						required: true,
						defaultValue: 5,
					}),
				};
				return fields;
			},
		}),
	},
	async run(context) {
		try {
			const page = await getPageWithContent(context.auth, context.propsValue.pageId);

			if (!context.propsValue.includeDescendants) {
				return page;
			}

			const children = await getChildPages(
				context.auth,
				context.propsValue.pageId,
				1,
				context.propsValue.dynamic['maxDepth'],
			);

			return {
				...page,
				children,
			};
		} catch (error) {
			throw new Error(
				`Failed to fetch page ${context.propsValue.pageId}: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	},
});
