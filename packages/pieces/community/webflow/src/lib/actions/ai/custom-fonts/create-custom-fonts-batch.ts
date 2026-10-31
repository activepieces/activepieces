import { createHash } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCustomFontsBatchOutputSchema } from '../../../output-schemas';

export const createCustomFontsBatchAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_custom_fonts_batch',
	outputSchema: webflowCreateCustomFontsBatchOutputSchema,
	displayName: 'Create Custom Fonts (Batch)',
	description: 'Uploads 1 to 25 font files as custom fonts on a site in one call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates 1-25 custom fonts on a site (e.g. the Regular, Bold and Italic files of one family): registers them in one request, then uploads each file to Webflow storage. Fonts Webflow rejects come back in failed (e.g. FontLimitReached) and are not uploaded. If an upload fails the error lists which font records exist without a file, for Delete Custom Font. Get the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		fonts: Property.Array({
			displayName: 'Fonts',
			description: '1-25 fonts, each a file (woff2, woff, ttf or otf) with its family, weight, italic and font-display.',
			required: true,
			properties: {
				file: Property.File({ displayName: 'Font File', required: true }),
				fontFamily: Property.ShortText({ displayName: 'Font Family', required: true }),
				weight: Property.Number({ displayName: 'Weight', description: 'CSS font-weight, 1-1000.', required: true }),
				italic: webflowAiProps.flag({ required: true, displayName: 'Italic' }),
				fontDisplay: Property.StaticDropdown({
					displayName: 'Font Display',
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
		}),
	},
	async run(context) {
		const { siteId, fonts } = context.propsValue;
		if (fonts.length < 1 || fonts.length > 25) {
			throw new Error('fonts must hold between 1 and 25 fonts.');
		}
		const items = fonts.map((font, index) => toFontItem({ font, index }));
		const response = await webflowClient.request<BatchCreateResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts/batchCreate`,
			body: {
				items: items.map(({ file, ...font }) => ({ ...font, fileName: file.filename })),
			},
		});
		const uploads = await Promise.all(
			response.created.map(async ({ customFont, upload }) => {
				const item = items.find((candidate) => candidate.fileHash === customFont.fileHash);
				if (!item) {
					return { customFont, error: 'no matching file in the input' };
				}
				const { error } = await tryCatch(() =>
					webflowClient.uploadFile({
						url: upload.url,
						fields: upload.fields,
						data: item.file.data,
						fileName: item.file.filename,
						contentType: undefined,
					}),
				);
				return { customFont, error: error ? error.message : null };
			}),
		);
		const uploadFailures = uploads.filter((upload) => upload.error !== null);
		if (uploadFailures.length > 0) {
			const list = uploadFailures.map((upload) => `${upload.customFont.id} (${upload.customFont.fileName}): ${upload.error}`).join('; ');
			throw new Error(
				`${response.created.length} font records were created, but ${uploadFailures.length} file uploads failed: ${list}. Delete Custom Font removes those records.`,
			);
		}
		return {
			created: response.created.map(({ customFont }) => customFont),
			failed: response.failed,
		};
	},
});

function toFontItem({ font, index }: { font: unknown; index: number }): FontItem {
	if (
		typeof font !== 'object' ||
		font === null ||
		!('file' in font) ||
		!isFontFile(font.file) ||
		!('fontFamily' in font) ||
		typeof font.fontFamily !== 'string' ||
		!('weight' in font) ||
		typeof font.weight !== 'number' ||
		!('fontDisplay' in font) ||
		typeof font.fontDisplay !== 'string'
	) {
		throw new Error(`fonts[${index}] needs a file, fontFamily, weight and fontDisplay.`);
	}
	return {
		file: font.file,
		fileHash: createHash('md5').update(font.file.data).digest('hex'),
		fontFamily: font.fontFamily,
		weight: font.weight,
		italic: 'italic' in font && font.italic === 'true',
		fontDisplay: font.fontDisplay,
	};
}

function isFontFile(value: unknown): value is FontFile {
	return (
		typeof value === 'object' &&
		value !== null &&
		'filename' in value &&
		typeof value.filename === 'string' &&
		'data' in value &&
		Buffer.isBuffer(value.data)
	);
}

type FontFile = {
	filename: string;
	data: Buffer;
};

type FontItem = {
	file: FontFile;
	fileHash: string;
	fontFamily: string;
	weight: number;
	italic: boolean;
	fontDisplay: string;
};

type BatchCreateResponse = {
	created: { customFont: { id: string; fileName: string; fileHash: string }; upload: { url: string; fields: Record<string, unknown> } }[];
	failed: unknown[];
};
