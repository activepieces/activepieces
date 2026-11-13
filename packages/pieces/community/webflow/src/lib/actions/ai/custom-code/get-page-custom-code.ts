import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetPageCustomCodeOutputSchema } from '../../../output-schemas';

export const getPageCustomCodeAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_page_custom_code',
	outputSchema: webflowGetPageCustomCodeOutputSchema,
	displayName: 'Get Page Custom Code',
	description: 'Gets the registered scripts applied to a page.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns the registered scripts applied to one page, with each script's id, version and location (header or footer). A 404 means no custom code is applied to the page yet. Get the page id from List Pages.",
		idempotent: true,
	},
	props: {
		pageId: webflowAiProps.pageId({ required: true }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/pages/${encodeURIComponent(context.propsValue.pageId)}/custom_code`,
		});
	},
});
