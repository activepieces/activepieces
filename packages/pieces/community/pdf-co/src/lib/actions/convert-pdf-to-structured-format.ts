import { Property, DropdownOption, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoSuccessResponse, PdfCoErrorResponse } from "../common";
import { pdfCoAuth } from "../../index";
// Interface for the request body (common params for CSV/JSON/XML conversion)
interface PdfConvertToStructuredFormatRequestBody {
    url: string;
    async: boolean;
    inline: boolean; // Should typically be false to get output URL
    name?: string;
    pages?: string;
    password?: string;
    lang?: string;
    expiration?: number;
    profiles?: Record<string, unknown>;
}

export const convertPdfToStructuredFormat = createAction({
    name: 'convert_pdf_to_structured_format',
    displayName: 'Convert PDF to JSON/CSV/XML',
    description: 'Convert PDF content into structured formats (JSON, CSV, or XML).',
    auth: pdfCoAuth,
    props: {
        url: Property.ShortText({
            displayName: 'Source PDF URL',
            description: 'URL of the PDF file to convert.',
            required: true,
        }),
        outputFormat: Property.Dropdown<'json' | 'csv' | 'xml'> ({
            displayName: 'Output Format',
            description: 'Select the desired structured output format.',
            required: true,
            refreshers: [],
            options: async () => {
                return {
                    options: [
                        { label: "JSON", value: "json" },
                        { label: "CSV", value: "csv" },
                        { label: "XML", value: "xml" },
                    ] as DropdownOption<'json' | 'csv' | 'xml'>[],
                };
            }
        }),
        pages: Property.ShortText({
            displayName: 'Pages',
            description: 'Comma-separated page numbers or ranges (e.g., "0,2,5-10"). Leave empty for all pages.',
            required: false,
        }),
        lang: Property.ShortText({
            displayName: 'OCR Language',
            description: 'Language for OCR if processing scanned documents (e.g., "eng", "deu", "eng+deu"). See PDF.co docs for list.',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'PDF Password',
            description: 'Password for password-protected PDF files.',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Desired name for the output file (e.g., "result.json"). Extension is usually added by API.',
            required: false,
        }),
        expiration: Property.Number({
            displayName: 'Output Link Expiration (minutes)',
            description: 'Set the expiration time for the output link in minutes (default is 60).',
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
            outputFormat,
            pages,
            lang,
            password,
            name,
            expiration,
            profiles
        } = propsValue;

        let endpoint = '';
        switch (outputFormat) {
            case 'json':
                endpoint = 'https://api.pdf.co/v1/pdf/convert/to/json2';
                break;
            case 'csv':
                endpoint = 'https://api.pdf.co/v1/pdf/convert/to/csv';
                break;
            case 'xml':
                endpoint = 'https://api.pdf.co/v1/pdf/convert/to/xml';
                break;
            default:
                throw new Error(`Unsupported output format: ${outputFormat}`);
        }

        const requestBody: PdfConvertToStructuredFormatRequestBody = {
            url: url,
            async: false,
            inline: false, // Ensure we get the URL to the output file
        };

        if (pages !== undefined && pages !== '') requestBody.pages = pages;
        if (lang !== undefined && lang !== '') requestBody.lang = lang;
        if (password !== undefined && password !== '') requestBody.password = password;
        if (name !== undefined && name !== '') requestBody.name = name;
        if (expiration !== undefined) requestBody.expiration = expiration;
        if (profiles !== undefined && typeof profiles === 'object' && profiles !== null) {
            requestBody.profiles = profiles as Record<string, unknown>;
        }

        try {
            const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: endpoint,
                headers: {
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            if (response.body.error) {
                const errorBody = response.body as PdfCoErrorResponse;
                let errorMessage = `PDF.co API Error (Convert PDF to ${outputFormat.toUpperCase()}): Status ${errorBody.status}.`;
                if (errorBody.message) {
                    errorMessage += ` Message: ${errorBody.message}.`;
                } else {
                    errorMessage += ` An unspecified error occurred.`;
                }
                errorMessage += ` Raw response: ${JSON.stringify(errorBody)}`;
                throw new Error(errorMessage);
            }

            const successBody = response.body as PdfCoSuccessResponse;
            return successBody;

        } catch (error) {
            if (error instanceof HttpError) {
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
                let detailedMessage = `HTTP Error calling PDF.co API (Convert PDF to ${outputFormat.toUpperCase()}): ${error.message}.`;
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
