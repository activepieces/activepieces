import { createHash } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCustomFontOutputSchema } from '../../../output-schemas';

export const replaceCustomFontFileAction = createAction({
	auth: webflowAuth,
	name: 'webflow_replace_custom_font_file',
	outputSchema: webflowCreateCustomFontOutputSchema,
	displayName: 'Replace Custom Font File',
	description: 'Replaces the file behind an existing custom font.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Replaces a custom font's file, keeping its id, family, weight and style: registers the new file, then uploads it to Webflow storage. Get the site id from List Sites and the font id from List Custom Fonts.",
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		fontId: Property.ShortText({
			displayName: 'Font ID',
			description: 'Custom font ID. Use List Custom Fonts to find it.',
			required: true,
		}),
		file: Property.File({
			displayName: 'Font File',
			description: 'The new font file: woff2, woff, ttf or otf.',
			required: true,
		}),
	},
	async run(context) {
		const { siteId, fontId, file } = context.propsValue;
		const { customFont, upload } = await webflowClient.request<CustomFontUploadResponse>({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts/${encodeURIComponent(fontId)}/file`,
			body: {
				fileName: file.filename,
				fileHash: createHash('md5').update(file.data).digest('hex'),
			},
		});
		const { error } = await tryCatch(() =>
			webflowClient.uploadFile({
				url: upload.url,
				fields: upload.fields,
				data: file.data,
				fileName: file.filename,
				contentType: undefined,
			}),
		);
		if (error) {
			throw new Error(
				`Webflow accepted the new file for font ${customFont.id} but the upload failed: ${error.message}. Run Replace Custom Font File again.`,
			);
		}
		return { customFont };
	},
});

type CustomFontUploadResponse = {
	customFont: { id: string };
	upload: { url: string; fields: Record<string, unknown> };
};
