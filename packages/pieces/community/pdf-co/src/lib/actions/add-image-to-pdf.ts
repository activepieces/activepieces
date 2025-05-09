import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoSuccessResponse, PdfCoErrorResponse } from "../common";
import { pdfCoAuth } from "../../index";

// Interface for a single image object to be added, based on PDF.co docs
interface PdfCoImageAnnotation {
    url: string; // URL to image or PDF as HTTP link, file token, or datauri
    x: number;
    y: number;
    pages?: string; // e.g., "0,2,5-10" or "0-"
    width?: number;
    height?: number;
    link?: string;
    keepAspectRatio?: boolean; // Default true
}

// Interface for the main request body for /pdf/edit/add with images
interface PdfCoAddImagesRequestBody {
    url: string; // Source PDF URL
    images: PdfCoImageAnnotation[];
    async: boolean;
    name?: string;
    password?: string;
    expiration?: number;
    inline?: boolean;
    profiles?: Record<string, unknown>;
}

export const addImageToPdf = createAction({
    name: 'add_image_to_pdf',
    displayName: 'Add Image(s) to PDF',
    description: 'Add one or more images to a PDF document.',
    auth: pdfCoAuth,
    props: {
        url: Property.ShortText({
            displayName: 'Source PDF URL',
            description: 'URL of the PDF file to modify.',
            required: true,
        }),
        images: Property.Json({
            displayName: 'Image Objects',
            description: 'Array of image objects to add. Each object requires `url` (image source), `x`, and `y`. Refer to PDF.co documentation for all properties.',
            required: true,
            defaultValue: [
                {
                    url: "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-edit/logo.png",
                    x: 50,
                    y: 50,
                    pages: "0",
                    width: 100
                }
            ]
        }),
        name: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Desired name for the output PDF file.',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'PDF Password',
            description: 'Password for password-protected PDF files.',
            required: false,
        }),
        expiration: Property.Number({
            displayName: 'Output Link Expiration (minutes)',
            description: 'Set the expiration time for the output link in minutes (default is 60).',
            required: false,
        }),
        inline: Property.Checkbox({
            displayName: 'Inline Response',
            description: 'Set to true to return results inside the response (synchronous calls are used by default).',
            required: false,
            defaultValue: false,
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
            images,
            name,
            password,
            expiration,
            inline,
            profiles
        } = propsValue;

        if (!Array.isArray(images) || images.length === 0) {
            throw new Error('Image Objects array (images property) must be a non-empty array.');
        }

        for (const img of images) {
            if (typeof img !== 'object' || img === null) {
                throw new Error('Each item in Image Objects must be an object.');
            }
            const imgAnn = img as PdfCoImageAnnotation;
            if (typeof imgAnn.url !== 'string' || typeof imgAnn.x !== 'number' || typeof imgAnn.y !== 'number') {
                throw new Error('Each image object must include `url` (string), `x` (number), and `y` (number) properties.');
            }
        }

        const requestBody: PdfCoAddImagesRequestBody = {
            url: url,
            images: images as PdfCoImageAnnotation[],
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
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

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
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
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
