import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';

import type { ConfluenceAuthValue, ConfluencePage } from '../common/types';
import { getpagecontentOutputSchema } from '../output-schemas';

export const getPageContent = createAction({
	name: 'getPageContent',
	outputSchema: getpagecontentOutputSchema,
	classification: 'READ',
	displayName: 'Get Page Content',
	description: 'Get page content and optionally all its descendants',
	audience: 'human',
	aiMetadata: { description: 'Fetches a single Confluence page (title and storage-format body) by its page ID; when "include descendants" is enabled it additionally walks the page tree and returns child pages recursively up to a configurable max depth. Use to read the full content of a known page, optionally including its sub-pages. Requires the numeric page ID (from the page URL); read-only and idempotent.', idempotent: true },
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
			auth: confluenceAuth,
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
			const page = await getPageWithContent({ auth: context.auth, pageId: context.propsValue.pageId });

			if (!context.propsValue.includeDescendants) {
				return page;
			}

			const children = await getChildPages({
				auth: context.auth,
				parentId: context.propsValue.pageId,
				currentDepth: 1,
				maxDepth: context.propsValue.dynamic['maxDepth'],
			});

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

async function getPageWithContent({
	auth,
	pageId,
}: {
	auth: ConfluenceAuthValue;
	pageId: string;
}): Promise<ConfluencePage> {
	try {
		const response = await confluenceApi.getPage({ auth, pageId, bodyFormat: 'storage' });
		return response;
	} catch (error) {
		throw new Error(
			`Failed to fetch page ${pageId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
}

async function getChildPages({
	auth,
	parentId,
	currentDepth,
	maxDepth,
}: {
	auth: ConfluenceAuthValue;
	parentId: string;
	currentDepth: number;
	maxDepth: number;
}): Promise<PageWithChildren[]> {
	if (currentDepth >= maxDepth) {
		return [];
	}

	try {
		const childPagesList = await confluenceApi.listPageChildren({ auth, pageId: parentId });

		const childPages = await Promise.all(
			childPagesList.map(async (childPage) => {
				const pageWithContent = await getPageWithContent({ auth, pageId: childPage.id });
				const children = await getChildPages({
					auth,
					parentId: childPage.id,
					currentDepth: currentDepth + 1,
					maxDepth,
				});
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

type PageWithChildren = ConfluencePage & { children: PageWithChildren[] };
