import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoErrorResponse } from "../common"; // Use common error response type
import { pdfCoAuth } from "../../index";
// Interface for the Document Parser API request body
interface PdfDocumentParserRequestBody {
    url: string;
    templateId: string; // Making this required for table extraction
    async: boolean;
    inline: boolean; // Set to true to get data in response
    outputFormat?: 'JSON' | 'CSV' | 'XML'; // Keep JSON for this action
    name?: string;
    pages?: string;
    password?: string;
    expiration?: number;
    profiles?: Record<string, unknown>;
}

// Interface for the structure within the successful response's 'body' field
interface PdfDocumentParserResult {
    objects: Array<{
        name: string;
        objectType: 'field' | 'table' | string; // Can be field, table, etc.
        value?: unknown; // For fields
        rows?: unknown[][]; // For tables
        pageIndex?: number;
        rectangle?: number[];
        [key: string]: unknown; // Allow other properties
    }>;
    templateName: string;
    templateVersion: string;
    timestamp: string;
}

// Interface for the overall successful response from the Document Parser endpoint
interface PdfDocumentParserSuccessResponse {
    body: PdfDocumentParserResult;
    pageCount: number;
    error: false;
    status: number;
    name: string; // Name of the generated output (e.g., sample-invoice.json)
    remainingCredits: number;
    credits: number;
    url?: string; // URL if inline=false
}

export const extractTablesFromPdf = createAction({
    name: 'extract_tables_from_pdf',
    displayName: 'Extract Tables from PDF (using Template)',
    description: 'Extracts table data from a PDF using a predefined PDF.co Document Parser template.',
    auth: pdfCoAuth, // Inherits auth from the piece
    props: {
        url: Property.ShortText({
            displayName: 'Source PDF URL',
            description: 'URL of the PDF file to extract tables from.',
            required: true,
        }),
        templateId: Property.ShortText({
            displayName: 'Template ID',
            description: 'The ID of your Document Parser template (created in PDF.co dashboard) designed to extract the table(s).',
            required: true,
        }),
        pages: Property.ShortText({
            displayName: 'Pages',
            description: 'Comma-separated page numbers or ranges (e.g., "0,2,5-10"). Overrides template settings if provided.',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'PDF Password',
            description: 'Password for password-protected PDF files.',
            required: false,
        }),
        outputName: Property.ShortText({
            displayName: 'Output Name Prefix',
            description: 'Optional prefix for the output name in the response (e.g., "extracted_tables"). Default name depends on API.',
            required: false,
        }),
        expiration: Property.Number({
            displayName: 'Output Link Expiration (minutes)',
            description: 'Set the expiration time for the temporary output link if generated (default is 60). Less relevant if data is inline.',
            required: false,
        }),
        profiles: Property.Json({
            displayName: 'Profiles',
            description: 'JSON object for additional configurations.',
            required: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            url,
            templateId,
            pages,
            password,
            outputName,
            expiration,
            profiles
        } = propsValue;

        const requestBody: PdfDocumentParserRequestBody = {
            url: url,
            templateId: templateId,
            async: false,
            inline: true, // Get the parsed data directly
            outputFormat: 'JSON', // We want JSON to process tables
        };

        if (pages !== undefined && pages !== '') requestBody.pages = pages;
        if (password !== undefined && password !== '') requestBody.password = password;
        if (outputName !== undefined && outputName !== '') requestBody.name = outputName;
        if (expiration !== undefined) requestBody.expiration = expiration;
        if (profiles !== undefined && typeof profiles === 'object' && profiles !== null) {
            requestBody.profiles = profiles as Record<string, unknown>;
        }

        try {
            const response = await httpClient.sendRequest<PdfDocumentParserSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: 'https://api.pdf.co/v1/pdf/documentparser',
                headers: {
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            if (response.body.error) {
                const errorBody = response.body as PdfCoErrorResponse;
                let errorMessage = `PDF.co API Error (Extract Tables): Status ${errorBody.status}.`;
                if (errorBody.message) {
                    errorMessage += ` Message: ${errorBody.message}.`;
                } else {
                    errorMessage += ` An unspecified error occurred.`;
                }
                errorMessage += ` Raw response: ${JSON.stringify(errorBody)}`;
                throw new Error(errorMessage);
            }

            const successBody = response.body as PdfDocumentParserSuccessResponse;

            // Filter the results to return only table objects
            const tables = successBody.body.objects.filter(obj => obj.objectType === 'table');

            return {
                extractedTables: tables, // Array of table objects found by the template
                templateNameUsed: successBody.body.templateName,
                fullResponse: successBody.body // Optionally return full response for debugging/advanced use
            };

        } catch (error) {
            if (error instanceof HttpError) {
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
                let detailedMessage = `HTTP Error calling PDF.co API (Extract Tables): ${error.message}.`;
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
