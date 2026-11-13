import { createHash } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCustomFontOutputSchema } from '../../../output-schemas';

export const createCustomFontAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_custom_font',
	outputSchema: webflowCreateCustomFontOutputSchema,
	displayName: 'Create Custom Font',
	description: 'Uploads a font file as a custom font on a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a custom font on a site from a font file (woff2, woff, ttf or otf): creates the font record, then uploads the file to Webflow storage. If the upload fails the font record still exists; the error gives its id so it can be removed with Delete Custom Font. Get the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		file: Property.File({
			displayName: 'Font File',
			description: 'The font file: woff2, woff, ttf or otf.',
			required: true,
		}),
		fontFamily: Property.ShortText({
			displayName: 'Font Family',
			description: 'CSS font-family name, e.g. "Inter".',
			required: true,
		}),
		weight: Property.Number({
			displayName: 'Weight',
			description: 'CSS font-weight, 1-1000, e.g. 400 for regular or 700 for bold.',
			required: true,
		}),
		italic: webflowAiProps.flag({
			required: true,
			displayName: 'Italic',
			description: 'Whether the font is italic.',
		}),
		fontDisplay: Property.StaticDropdown({
			displayName: 'Font Display',
			description: 'CSS font-display value.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Auto', value: 'auto' },
					{ label: 'Block', value: 'block' },
					{ label: 'Swap', value: 'swap' },
					{ label: 'Fallback', value: 'fallback' },
					{ label: 'Optional', value: 'optional' },
				],
			},
		}),
	},
	async run(context) {
		const { siteId, file, fontFamily, weight, italic, fontDisplay } = context.propsValue;
		const { customFont, upload } = await webflowClient.request<CustomFontUploadResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts`,
			body: {
				fileName: file.filename,
				fileHash: createHash('md5').update(file.data).digest('hex'),
				fontFamily,
				weight,
				italic: italic === 'true',
				fontDisplay,
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
				`The custom font record was created (id ${customFont.id}) but the file upload failed: ${error.message}. Delete Custom Font removes the empty record.`,
			);
		}
		return { customFont };
	},
});

type CustomFontUploadResponse = {
	customFont: { id: string };
	upload: { url: string; fields: Record<string, unknown> };
};
