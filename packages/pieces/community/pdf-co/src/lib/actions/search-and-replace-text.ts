import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpError } from '@activepieces/pieces-common';
import { PdfCoSuccessResponse, PdfCoErrorResponse } from '../common/types';
import { pdfCoAuth } from '../../index';
import { BASE_URL, commonProps } from '../common/props';

interface PdfCoSearchAndReplaceRequestBody {
	url: string;
	searchStrings: string[];
	replaceStrings: string[];
	async: boolean;
	caseSensitive?: boolean;
	regex?: boolean;
	pages?: string;
	name?: string;
	expiration?: number;
	httpusername?: string;
	httppassword?: string;
	password?: string;
}

export const searchAndReplaceText = createAction({
	name: 'search_and_replace_text',
	displayName: 'Search and Replace Text in PDF',
	description: 'Search for specific text or patterns in a PDF and replace it with new text.',
	auth: pdfCoAuth,
	props: {
		url: Property.ShortText({
			displayName: 'PDF URL',
			description: 'URL to the source PDF file.',
			required: true,
		}),
		searchStrings: Property.Array({
			displayName: 'Text to Locate',
			required: true,
		}),
		replaceStrings: Property.Array({
			displayName: 'Replacement Text',
			required: true,
		}),
		caseSensitive: Property.Checkbox({
			displayName: 'Case Sensitive',
			description: 'Set to true for case-sensitive search, false otherwise.',
			required: false,
			defaultValue: true,
		}),
		regex: Property.Checkbox({
			displayName: 'Use Regular Expressions ?',
			description: 'Set to true to use regular expressions for search texts.',
			required: false,
			defaultValue: false,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description:
				'Comma-separated page numbers or ranges (e.g., "0,2,5-10"). Leave empty for all pages.',
			required: false,
		}),
		...commonProps,
	},
	async run(context) {
		const { auth, propsValue } = context;
		const {
			url,
			searchStrings,
			replaceStrings,
			caseSensitive,
			regex,
			pages,
			fileName,
			httpPassword,
			httpUsername,
			pdfPassword,
			expiration,
		} = propsValue;

		const requestBody: PdfCoSearchAndReplaceRequestBody = {
			url: url,
			searchStrings: searchStrings as string[],
			replaceStrings: replaceStrings as string[],
			async: false,
			caseSensitive: caseSensitive,
			regex,
			pages,
			name: fileName,
			expiration,
			httppassword: httpPassword,
			httpusername: httpUsername,
			password: pdfPassword,
		};

		try {
			const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
				method: HttpMethod.POST,
				url: `${BASE_URL}/pdf/edit/replace-text`,
				headers: {
					'x-api-key': auth,
					'Content-Type': 'application/json',
				},
				body: requestBody,
			});

			if (response.body.error) {
				const errorBody = response.body as PdfCoErrorResponse;
				let errorMessage = `PDF.co API Error: Status ${errorBody.status}.`;
				if (errorBody.message) {
					errorMessage += ` Message: ${errorBody.message}.`;
				} else {
					errorMessage += ` An unspecified error occurred.`;
				}
				errorMessage += ` Check input parameters, API key, and PDF.co dashboard for more details. Raw response: ${JSON.stringify(
					errorBody,
				)}`;
				throw new Error(errorMessage);
			}

			return response.body;
		} catch (error) {
			if (error instanceof HttpError) {
				const responseBody = error.response?.body as PdfCoErrorResponse | undefined;
				let detailedMessage = `HTTP Error calling PDF.co API: ${error.message}.`;
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
