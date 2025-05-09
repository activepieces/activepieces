import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoSuccessResponse, PdfCoErrorResponse } from "../common";
import { pdfCoAuth } from "../../index";

interface PdfCoSearchAndReplaceRequestBody {
    url: string;
    searchStrings: string[];
    replaceStrings: string[];
    async: boolean;
    caseSensitive?: boolean;
    regex?: boolean;
    pages?: string;
    name?: string;
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
            displayName: 'Search Strings',
            description: 'Array of strings to search for (case-sensitive by default).',
            required: true,
        }),
        replaceStrings: Property.Array({
            displayName: 'Replace Strings',
            description: 'Array of strings to replace the found text with.',
            required: true,
        }),
        caseSensitive: Property.Checkbox({
            displayName: 'Case Sensitive',
            description: 'Set to true for case-sensitive search, false otherwise.',
            required: false,
            defaultValue: true,
        }),
        regex: Property.Checkbox({
            displayName: 'Use Regular Expressions',
            description: 'Set to true to use regular expressions for search strings.',
            required: false,
            defaultValue: false,
        }),
        pages: Property.ShortText({
            displayName: 'Pages',
            description: 'Comma-separated page numbers or ranges (e.g., "0,2,5-10"). Leave empty for all pages.',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Desired name for the output PDF file (e.g., "result.pdf").',
            required: false,
        }),
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
            name
        } = propsValue;

        const requestBody: PdfCoSearchAndReplaceRequestBody = {
            url: url,
            searchStrings: searchStrings as string[],
            replaceStrings: replaceStrings as string[],
            async: false,
            caseSensitive: caseSensitive,
            regex: regex,
        };

        if (pages !== undefined && pages !== '') requestBody.pages = pages;
        if (name !== undefined && name !== '') requestBody.name = name;

        try {
            const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: 'https://api.pdf.co/v1/pdf/edit/replace-text',
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
                errorMessage += ` Check input parameters, API key, and PDF.co dashboard for more details. Raw response: ${JSON.stringify(errorBody)}`;
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
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
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
