import { createHash } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowUploadAssetOutputSchema } from '../../../output-schemas';

export const uploadAssetAction = createAction({
	auth: webflowAuth,
	name: 'webflow_upload_asset',
	outputSchema: webflowUploadAssetOutputSchema,
	displayName: 'Upload Asset',
	description: 'Uploads a file to the assets of a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file as a new site asset: creates the asset record, then uploads the file bytes to Webflow storage. If the upload fails the asset record still exists; the error gives its id so it can be removed with Delete Asset. Get the site id from List Sites and the folder id from List Asset Folders or Create Asset Folder.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload.',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'File name with extension, under 100 characters, e.g. "hero.png". Defaults to the uploaded file name.',
			required: false,
		}),
		parentFolder: Property.ShortText({
			displayName: 'Asset Folder ID',
			description: 'Asset folder to put the asset in. Use List Asset Folders to find it. Defaults to the root.',
			required: false,
		}),
	},
	async run(context) {
		const { siteId, file, fileName, parentFolder } = context.propsValue;
		const { uploadUrl, uploadDetails, ...asset } = await webflowClient.request<CreateAssetResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/assets`,
			body: {
				fileName: fileName ?? file.filename,
				fileHash: createHash('md5').update(file.data).digest('hex'),
				...(parentFolder ? { parentFolder } : {}),
			},
		});
		const { error } = await tryCatch(() =>
			webflowClient.uploadFile({ url: uploadUrl, fields: uploadDetails, data: file.data, fileName: fileName ?? file.filename, contentType: asset.contentType }),
		);
		if (error) {
			throw new Error(
				`The asset record was created (id ${asset.id}) but the file upload failed: ${error.message}. Delete Asset removes the empty record.`,
			);
		}
		return asset;
	},
});

type CreateAssetResponse = {
	id: string;
	contentType?: string;
	uploadUrl: string;
	uploadDetails: Record<string, unknown>;
	[key: string]: unknown;
};
