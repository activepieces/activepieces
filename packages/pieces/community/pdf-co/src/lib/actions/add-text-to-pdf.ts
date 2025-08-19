import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpError } from '@activepieces/pieces-common';
import { PdfCoSuccessResponse, PdfCoErrorResponse } from '../common/types';
import { pdfCoAuth } from '../../index';
import { BASE_URL, commonProps } from '../common/props';

// Interface for a single text annotation object based on PDF.co docs
interface PdfCoTextAnnotation {
	text: string;
	x: number;
	y: number;
	pages?: string;
	size?: number;
	fontName?: string;
	color?: string;
	link?: string;
	width?: number;
	height?: number;
	fontBold?: boolean;
	fontUnderline?: boolean;
	fontStrikeout?: boolean;
	alignment?: string;
	type?: 'text' | 'textField' | 'TextFieldMultiline' | 'checkbox';
	id?: string;
	transparent?: boolean;
	RotationAngle?: number;
}

// Interface for the main request body for /pdf/edit/add
interface PdfCoAddAnnotationsRequestBody {
	url: string;
	annotations: PdfCoTextAnnotation[];
	async: boolean;
	name?: string;
	password?: string;
	expiration?: number;
	inline?: boolean;
	profiles?: Record<string, unknown>; // JSON object for profiles
	httpusername?: string;
	httppassword?: string;
}

export const addTextToPdf = createAction({
	name: 'add_text_to_pdf',
	displayName: 'Add Text to PDF',
	description: 'Adds text to PDF.',
	auth: pdfCoAuth,
	props: {
		url: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to modify.',
			required: true,
		}),
		text: Property.LongText({
			displayName: 'Text to Add',
			required: true,
		}),
		xCoordinate: Property.Number({
			displayName: 'X Coordinate',
			required: true,
		}),
		yCoordinate: Property.Number({
			displayName: 'Y Coordinate',
			required: true,
		}),
		fontSize: Property.Number({
			displayName: 'Font Size',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			defaultValue: '#000000',
			required: false,
		}),
		fontBold: Property.Checkbox({
			displayName: 'Bold Font ?',
			required: false,
		}),
		fontStrikeout: Property.Checkbox({
			displayName: 'Stikeout Font ?',
			required: false,
		}),
		fontUnderline: Property.Checkbox({
			displayName: 'Underline Font ?',
			required: false,
		}),
		fontName: Property.ShortText({
			displayName: 'Font Name',
			defaultValue: 'Arial',
			required: false,
		}),
		pages: Property.ShortText({
			displayName: 'Target Pages',
			description:
				'Specify page indices as comma-separated values or ranges to process (e.g. "0, 1, 2-" or "1, 2, 3-7").',
			required: false,
		}),
		textBoxHeight: Property.Number({
			displayName: 'Text Box Height',
			required: false,
		}),
		textBoxWidth: Property.Number({
			displayName: 'Text Box Width',
			required: false,
		}),
		textBoxAlignment: Property.StaticDropdown({
			displayName: 'Text Box Alignment',
			required: false,
			defaultValue: 'left',
			options: {
				disabled: false,
				options: [
					{ label: 'left', value: 'left' },
					{ label: 'right', value: 'right' },
					{ label: 'center', value: 'center' },
				],
			},
		}),
		...commonProps,
	},
	async run(context) {
		const { auth, propsValue } = context;
		const {
			url,
			xCoordinate,
			yCoordinate,
			fontSize,
			fontName,
			fontBold,
			fontStrikeout,
			fontUnderline,
			color,
			pages,
			textBoxAlignment,
			textBoxHeight,
			textBoxWidth,
			text,
			fileName,
			pdfPassword,
			httpPassword,
			httpUsername,
			expiration,
		} = propsValue;

		const textAnnotationPayload: PdfCoTextAnnotation = {
			x: xCoordinate,
			y: yCoordinate,
			text,
			type: 'text',
			color,
			pages,
			width: textBoxWidth,
			height: textBoxHeight,
			alignment: textBoxAlignment,
			size: fontSize,
			fontName,
			fontBold,
			fontStrikeout,
			fontUnderline,
		};

		const requestBody: PdfCoAddAnnotationsRequestBody = {
			url: url,
			annotations: [textAnnotationPayload],
			async: false,
			name: fileName,
			expiration,
			httppassword: httpPassword,
			httpusername: httpUsername,
			password: pdfPassword,
		};

		try {
			const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
				method: HttpMethod.POST,
				url: `${BASE_URL}/pdf/edit/add`,
				headers: {
					'x-api-key': auth,
					'Content-Type': 'application/json',
				},
				body: requestBody,
			});

			if (response.body.error) {
				const errorBody = response.body as PdfCoErrorResponse;
				let errorMessage = `PDF.co API Error (Add Text): Status ${errorBody.status}.`;
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
				let detailedMessage = `HTTP Error calling PDF.co API (Add Text): ${error.message}.`;
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
