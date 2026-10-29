import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { commonProps, PDF_CO_DEFAULTS, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const addImageToPdf = createAction({
	name: 'add_image_to_pdf',
	classification: 'WRITE',
	displayName: 'Add Image to PDF',
	description: 'Add image to a PDF document.',
	audience: 'human',
	aiMetadata: {
		description:
			'Overlays an image (referenced by URL) onto a source PDF (referenced by URL) at the given x/y coordinates, optionally on specific pages (first page is 0). Agents should use Edit PDF (AI), which adds several images, texts and form values in one call. Each call produces a new output PDF file and consumes credits, so it is not idempotent.',
		idempotent: false,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.legacyEdit,
	props: {
		url: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to modify.',
			required: true,
		}),
		imageUrl: Property.ShortText({
			displayName: 'Image URL',
			required: true,
		}),
		xCoordinate: Property.Number({
			displayName: 'X Coordinate',
			description: 'X coordinate (from top-left corner) to place the image.',
			required: true,
		}),
		yCoordinate: Property.Number({
			displayName: 'Y Coordinate',
			required: true,
			description: 'Y coordinate (from top-left corner) to place the image.',
		}),
		width: Property.Number({
			displayName: 'Width',
			description:
				'Optional width for the image on the PDF (in points). Aspect ratio is kept by default.',
			required: false,
		}),
		height: Property.Number({
			displayName: 'Height',
			description:
				'Optional height for the image on the PDF (in points). Aspect ratio is kept by default.',
			required: false,
		}),
		pages: Property.ShortText({
			displayName: 'Target Pages',
			description:
				'Page indexes as comma-separated values or ranges (first page is 0), e.g. "0, 1, 2-" or "1, 2, 3-7".',
			required: false,
		}),
		...commonProps,
		saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnExistingActions }),
	},
	async run({ auth, propsValue, files }) {
		const body = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey: pdfCoClient.apiKeyOf(auth),
				method: HttpMethod.POST,
				path: '/v1/pdf/edit/add',
				body: {
					url: propsValue.url,
					images: [
						{
							url: propsValue.imageUrl,
							x: propsValue.xCoordinate,
							y: propsValue.yCoordinate,
							pages: propsValue.pages,
							height: propsValue.height,
							width: propsValue.width,
						},
					],
					async: false,
					name: propsValue.fileName,
					expiration: propsValue.expiration,
					httppassword: propsValue.httpPassword,
					httpusername: propsValue.httpUsername,
					password: propsValue.pdfPassword,
					inline: false,
				},
			}),
		);
		return pdfCoJobs.legacyEditOutput({ body, files, saveOutputFile: propsValue.saveOutputFile, fileName: propsValue.fileName });
	},
});
