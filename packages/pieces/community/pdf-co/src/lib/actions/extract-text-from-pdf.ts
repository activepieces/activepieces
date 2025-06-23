import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { pdfCoAuth } from "../../index";
import { BASE_URL, commonProps } from "../common/props";

interface PdfCoExtractTextSuccessResponse {
    body: string; // The extracted text content
    pageCount: number;
    error: false;
    status: number;
    name: string; // Output file name (e.g., sample.txt)
    remainingCredits: number;
    credits: number;
    url?: string; // URL to output file if inline=false
}

// Define a type for the expected error response body (can use common one if it matches)
interface PdfCoErrorResponse {
    error: true;
    status: number;
    message?: string;
    [key: string]: unknown;
}

// Interface for the request body
interface PdfConvertToTextSimpleRequestBody {
    url: string;
    async: boolean;
    inline: boolean; // Keep true to get text directly in response body
    name?: string;
    pages?: string;
    password?: string;
    httpusername?: string;
	httppassword?: string;
}

export const extractTextFromPdf = createAction({
    name: 'extract_text_from_pdf',
    displayName: 'Extract Plain Text from PDF',
    description: 'Extracts plain text content from a PDF document.',
    auth: pdfCoAuth,
    props: {
        url: Property.ShortText({
            displayName: 'Source PDF URL',
            description: 'URL of the PDF file to extract text from.',
            required: true,
        }),
        pages: Property.ShortText({
            displayName: 'Pages',
            description: 'Comma-separated page numbers or ranges (e.g., "0,2,5-10"). Leave empty for all pages.',
            required: false,
        }),
        password: commonProps.pdfPassword,
        outputName: commonProps.fileName,
        httpUsername:commonProps.httpUsername,
        httpPassword:commonProps.httpPassword
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            url,
            pages,
            password,
            outputName,
            httpPassword,
            httpUsername
        } = propsValue;

        const requestBody: PdfConvertToTextSimpleRequestBody = {
            url: url,
            async: false,
            httpusername:httpUsername,
            httppassword:httpPassword,
            inline: true, // Get text directly in response.body.body
        };

        if (pages !== undefined && pages !== '') requestBody.pages = pages;
        if (password !== undefined && password !== '') requestBody.password = password;
        if (outputName !== undefined && outputName !== '') requestBody.name = outputName;

        try {
            const response = await httpClient.sendRequest<PdfCoExtractTextSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: `${BASE_URL}/pdf/convert/to/text-simple`,
                headers: {
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            if (response.body.error) {
                const errorBody = response.body as PdfCoErrorResponse;
                let errorMessage = `PDF.co API Error (Extract Text): Status ${errorBody.status}.`;
                if (errorBody.message) {
                    errorMessage += ` Message: ${errorBody.message}.`;
                } else {
                    errorMessage += ` An unspecified error occurred.`;
                }
                errorMessage += ` Raw response: ${JSON.stringify(errorBody)}`;
                throw new Error(errorMessage);
            }

            const successBody = response.body as PdfCoExtractTextSuccessResponse;

            return {
                extractedText: successBody.body,
                pageCount: successBody.pageCount,
                outputName: successBody.name,
                creditsUsed: successBody.credits,
                remainingCredits: successBody.remainingCredits,
            };

        } catch (error) {
            if (error instanceof HttpError) {
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
                let detailedMessage = `HTTP Error calling PDF.co API (Extract Text): ${error.message}.`;
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
