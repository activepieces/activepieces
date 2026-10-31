import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeletePageCustomCodeOutputSchema } from '../../../output-schemas';

export const deletePageCustomCodeAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_page_custom_code',
	outputSchema: webflowDeletePageCustomCodeOutputSchema,
	displayName: 'Delete Page Custom Code',
	description: 'Removes all scripts this app applied to a page.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes every script this app applied to a page. The scripts stay registered on the site and can be applied again with Upsert Page Custom Code; to remove only some scripts, use Upsert Page Custom Code without them. Get the page id from List Pages.',
		idempotent: false,
	},
	props: {
		pageId: webflowAiProps.pageId({ required: true }),
	},
	async run(context) {
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/pages/${encodeURIComponent(context.propsValue.pageId)}/custom_code`,
		});
		return { success: true, pageId: context.propsValue.pageId };
	},
});
