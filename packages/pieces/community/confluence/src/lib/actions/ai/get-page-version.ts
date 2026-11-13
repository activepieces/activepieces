import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetBlogPostVersionOutputSchema } from '../../output-schemas';

export const getPageVersionAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_page_version',
	outputSchema: confluenceGetBlogPostVersionOutputSchema,
	displayName: 'Get Page Version',
	description: 'Gets the details of one version of a page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the details of one version of a Confluence page: author, date, message, minor-edit flag and the neighbouring versions. Get version numbers from List Page Versions; use Get Page with Version to read that version body.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
		versionNumber: confluenceAiProps.versionNumber({ required: true }),
	},
	async run(context) {
		const { pageId, versionNumber } = context.propsValue;
		return await confluenceApi.getContentVersion({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			versionNumber,
		});
	},
});
