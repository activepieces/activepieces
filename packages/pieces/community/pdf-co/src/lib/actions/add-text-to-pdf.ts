import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoSuccessResponse, PdfCoErrorResponse } from "../common";
import { pdfCoAuth } from "../../index";

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
    fontItalic?: boolean;
    fontUnderline?: boolean;
    fontStrikeout?: boolean;
    alignment?: 'left' | 'center' | 'right';
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
}

export const addTextToPdf = createAction({
    name: 'add_text_to_pdf',
    displayName: 'Add Text to PDF',
    description: 'Add one or more text elements to a PDF document.',
    auth: pdfCoAuth,
    props: {
        url: Property.ShortText({
            displayName: 'Source PDF URL',
            description: 'URL of the PDF file to modify.',
            required: true,
        }),
        annotations: Property.Json({
            displayName: 'Text Annotations',
            description: 'Array of text objects to add. Each object requires at least `text`, `x`, and `y`. Refer to PDF.co documentation for all possible properties.',
            required: true,
            defaultValue: [
                {
                    text: "Sample Text",
                    x: 50,
                    y: 50,
                    pages: "0",
                    size: 12,
                    fontName: "Arial",
                    color: "000000"
                }
            ]
        }),
        name: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Desired name for the output PDF file (e.g., "result.pdf").',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'PDF Password',
            description: 'Password for password-protected PDF files.',
            required: false,
        }),
        expiration: Property.Number({
            displayName: 'Output Link Expiration (minutes)',
            description: 'Set the expiration time for the output link in minutes (default is 60). API expects an integer.',
            required: false,
        }),
        inline: Property.Checkbox({
            displayName: 'Inline Response',
            description: 'Set to true to return results inside the response (only applies if async is true). Synchronous calls are used by default in this piece.',
            required: false,
            defaultValue: false,
        }),
        profiles: Property.Json({
            displayName: 'Profiles',
            description: 'JSON object for additional configurations (e.g., { \'FlattenDocument()\': [] }). Refer to PDF.co profiles documentation.',
            required: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            url,
            annotations,
            name,
            password,
            expiration,
            inline,
            profiles
        } = propsValue;

        if (!Array.isArray(annotations) || annotations.length === 0) {
            throw new Error('Text Annotations array (annotations property) must be a non-empty array.');
        }

        for (const ann of annotations) {
            if (typeof ann !== 'object' || ann === null) {
                throw new Error('Each item in Text Annotations must be an object.');
            }
            if (typeof (ann as PdfCoTextAnnotation).text !== 'string' ||
                typeof (ann as PdfCoTextAnnotation).x !== 'number' ||
                typeof (ann as PdfCoTextAnnotation).y !== 'number') {
                throw new Error('Each text annotation object must include `text` (string), `x` (number), and `y` (number) properties.');
            }
        }

        const requestBody: PdfCoAddAnnotationsRequestBody = {
            url: url,
            annotations: annotations as PdfCoTextAnnotation[],
            async: false,
        };

        if (name !== undefined && name !== '') requestBody.name = name;
        if (password !== undefined && password !== '') requestBody.password = password;
        if (expiration !== undefined) requestBody.expiration = expiration;
        if (inline !== undefined) requestBody.inline = inline;
        if (profiles !== undefined && typeof profiles === 'object' && profiles !== null) {
            requestBody.profiles = profiles as Record<string, unknown>;
        }

        try {
            const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: 'https://api.pdf.co/v1/pdf/edit/add',
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
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
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
