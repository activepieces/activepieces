import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpError } from '@activepieces/pieces-common';
import {
	PdfCoSuccessResponse,
	PdfCoErrorResponse,
	PdfCoImageAnnotation,
	PdfCoAddImagesRequestBody,
} from '../common/types';
import { pdfCoAuth } from '../../index';
import { BASE_URL, commonProps } from '../common/props';

export const addImageToPdf = createAction({
	name: 'add_image_to_pdf',
	displayName: 'Add Image to PDF',
	description: 'Add image to a PDF document.',
	auth: pdfCoAuth,
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
				'Specify page indices as comma-separated values or ranges to process (e.g. "0, 1, 2-" or "1, 2, 3-7").',
			required: false,
		}),
		...commonProps,
	},
	async run(context) {
		const { auth, propsValue } = context;
		const {
			url,
			imageUrl,
			fileName,
			pdfPassword,
			xCoordinate,
			pages,
			yCoordinate,
			width,
			height,
			expiration,
			httpPassword,
			httpUsername,
		} = propsValue;

		const imageAnnotationPayload: PdfCoImageAnnotation = {
			url: imageUrl,
			x: xCoordinate,
			y: yCoordinate,
			pages,
			height,
			width,
		};

		const requestBody: PdfCoAddImagesRequestBody = {
			url: url,
			images: [imageAnnotationPayload],
			async: false,
			name: fileName,
			expiration,
			httppassword: httpPassword,
			httpusername: httpUsername,
			password: pdfPassword,
			inline: false,
		};

		try {
			const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
				method: HttpMethod.POST,
				url: `${BASE_URL}/pdf/edit/add`,
				headers: {
					'x-api-key': auth as string,
					'Content-Type': 'application/json',
				},
				body: requestBody,
			});

			console.log(JSON.stringify(response, null, 2));

			if (response.body.error) {
				const errorBody = response.body as PdfCoErrorResponse;
				let errorMessage = `PDF.co API Error (Add Image): Status ${errorBody.status}.`;
				if (errorBody.message) {
					errorMessage += ` Message: ${errorBody.message}.`;
				} else {
					errorMessage += ` An unspecified error occurred.`;
				}
				errorMessage += ` Raw response: ${JSON.stringify(errorBody)}`;
				throw new Error(errorMessage);
			}

			const successBody = response.body as PdfCoSuccessResponse;
			return {
				outputUrl: successBody.url,
				pageCount: successBody.pageCount,
				outputName: successBody.name,
				creditsUsed: successBody.credits,
				remainingCredits: successBody.remainingCredits,
			};
		} catch (error) {
			if (error instanceof HttpError) {
				const responseBody = error.response?.body as PdfCoErrorResponse | undefined;
				let detailedMessage = `HTTP Error calling PDF.co API (Add Image): ${error.message}.`;
				if (responseBody && responseBody.message) {
					detailedMessage += ` Server message: ${responseBody.message}.`;
				} else if (responseBody) {
					detailedMessage += ` Server response: ${JSON.stringify(responseBody)}.`;
				}
				throw new Error(detailedMessage);
			}
			throw error;
		}
	},
});
