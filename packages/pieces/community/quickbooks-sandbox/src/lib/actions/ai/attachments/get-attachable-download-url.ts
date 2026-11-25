import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksClient } from '../../../common/client';
import { quickbooksSandboxGetAttachableDownloadUrlOutputSchema } from '../../../output-schemas';

export const getAttachableDownloadUrlAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_attachable_download_url',
	outputSchema: quickbooksSandboxGetAttachableDownloadUrlOutputSchema,
	displayName: 'Get Attachable Download URL',
	description: 'Gets a temporary download link for an uploaded attachment.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns a temporary, pre-signed URL that downloads the file of one uploaded attachable without QuickBooks credentials; the link expires after a short time, so call again for a fresh one. Notes without a file have nothing to download. Get the id from List Attachables or Upload Attachable.',
		idempotent: true,
	},
	props: {
		attachableId: quickbooksAiProps.id({
			required: true,
			displayName: 'Attachable ID',
			description: 'QuickBooks attachable id of an uploaded file. Use List Attachables to find it.',
		}),
	},
	async run(context) {
		const url = await quickbooksClient.request<string>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/download/${encodeURIComponent(context.propsValue.attachableId)}`,
			accept: 'text/plain',
			responseType: 'text',
		});
		return { url };
	},
});
