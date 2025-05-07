import { Property, DropdownOption, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoSuccessResponse, PdfCoErrorResponse } from "../common";
import { pdfCoAuth } from "../../index";
// Interface for /barcode/generate request
interface BarcodeGenerateRequestBody {
    value: string;
    type?: string;
    async: boolean;
    inline: boolean; // Must be false to get URL
    name?: string;
    decorationImage?: string;
    profiles?: Record<string, unknown>;
}

// Interface for /barcode/generate success response (when inline=false)
interface BarcodeGenerateSuccessResponse {
    url: string; // URL to the generated barcode image
    error: false;
    status: number;
    name: string;
    duration: number;
    remainingCredits: number;
    credits: number;
}

// Interface for the image object needed by /pdf/edit/add
interface PdfCoImageAnnotation {
    url: string;
    x: number;
    y: number;
    pages?: string;
    width?: number;
    height?: number;
    link?: string;
    keepAspectRatio?: boolean;
}

// Interface for the /pdf/edit/add request body (when adding images)
interface PdfCoAddImagesRequestBody {
    url: string; // Source PDF URL
    images: PdfCoImageAnnotation[];
    async: boolean;
    inline: boolean; // Should be false to get final PDF url
    name?: string;
    password?: string;
    expiration?: number;
    profiles?: Record<string, unknown>;
}

// Supported Barcode Types
const barcodeTypes: DropdownOption<string>[] = [
    { label: "QR Code (Default)", value: "QRCode" },
    { label: "DataMatrix", value: "DataMatrix" },
    { label: "Code 128", value: "Code128" },
    { label: "Code 39", value: "Code39" },
    { label: "PDF417", value: "PDF417" },
    { label: "EAN-13", value: "EAN13" },
    { label: "UPC-A", value: "UPCA" },
];

export const addBarcodeToPdf = createAction({
    name: 'add_barcode_to_pdf',
    displayName: 'Add Barcode to PDF',
    description: 'Generate a barcode image and add it to a specific location on a PDF.',
    auth: pdfCoAuth,
    props: {
        sourcePdfUrl: Property.ShortText({
            displayName: 'Source PDF URL',
            description: 'URL of the PDF file to add the barcode to.',
            required: true,
        }),
        barcodeValue: Property.ShortText({
            displayName: 'Barcode Value',
            description: 'The text or data to encode in the barcode.',
            required: true,
        }),
        barcodeType: Property.Dropdown<string>({
            displayName: 'Barcode Type',
            description: 'Select the type of barcode to generate.',
            required: true,
            refreshers: [],
            options: async () => ({ options: barcodeTypes, placeholder: "Select Barcode Type" })
        }),
        x: Property.Number({
            displayName: 'X Coordinate',
            description: 'X coordinate (from top-left corner) to place the barcode.',
            required: true,
        }),
        y: Property.Number({
            displayName: 'Y Coordinate',
            description: 'Y coordinate (from top-left corner) to place the barcode.',
            required: true,
        }),
        width: Property.Number({
            displayName: 'Width (optional)',
            description: 'Optional width for the barcode image on the PDF (in points). Aspect ratio is kept by default.',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Height (optional)',
            description: 'Optional height for the barcode image on the PDF (in points). Aspect ratio is kept by default.',
            required: false,
        }),
        pages: Property.ShortText({
            displayName: 'Pages',
            description: 'Comma-separated page numbers or ranges to add the barcode (e.g., "0,2,5-10"). Leave empty for all pages.',
            required: false,
        }),
        outputPdfName: Property.ShortText({
            displayName: 'Output PDF Name',
            description: 'Desired name for the final output PDF file (e.g., "result_with_barcode.pdf").',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'Source PDF Password',
            description: 'Password if the source PDF is protected.',
            required: false,
        }),
        expiration: Property.Number({
            displayName: 'Output Link Expiration (minutes)',
            description: 'Set the expiration time for the output PDF link (default is 60).',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            sourcePdfUrl,
            barcodeValue,
            barcodeType,
            x,
            y,
            width,
            height,
            pages,
            outputPdfName,
            password,
            expiration,
        } = propsValue;

        let barcodeImageUrl = '';

        // --- Step 1: Generate Barcode ---
        const generateBarcodeBody: BarcodeGenerateRequestBody = {
            value: barcodeValue,
            type: barcodeType,
            async: false,
            inline: false, // Need the URL
        };

        try {
            const generateResponse = await httpClient.sendRequest<BarcodeGenerateSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: 'https://api.pdf.co/v1/barcode/generate',
                headers: {
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: generateBarcodeBody,
            });

            if (generateResponse.body.error) {
                const errorBody = generateResponse.body as PdfCoErrorResponse;
                throw new Error(`PDF.co Barcode Generation Error: Status ${errorBody.status}. ${errorBody.message || 'Unknown error.'}`);
            }

            barcodeImageUrl = (generateResponse.body as BarcodeGenerateSuccessResponse).url;
            if (!barcodeImageUrl) {
                throw new Error("Failed to get barcode image URL from PDF.co response.");
            }

        } catch (error) {
            if (error instanceof HttpError) {
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
                throw new Error(`HTTP Error generating barcode: ${error.message}. ${responseBody?.message ? 'Server message: ' + responseBody.message : 'Raw response: ' + JSON.stringify(responseBody)}`);
            }
            throw error; // Re-throw other errors
        }

        // --- Step 2: Add Barcode Image to PDF ---
        const imageAnnotation: PdfCoImageAnnotation = {
            url: barcodeImageUrl,
            x: x,
            y: y,
        };
        if (width !== undefined) imageAnnotation.width = width;
        if (height !== undefined) imageAnnotation.height = height;
        if (pages !== undefined && pages !== '') imageAnnotation.pages = pages;

        const addImageBody: PdfCoAddImagesRequestBody = {
            url: sourcePdfUrl,
            images: [imageAnnotation],
            async: false,
            inline: false, // Get final PDF URL
        };

        if (outputPdfName !== undefined && outputPdfName !== '') addImageBody.name = outputPdfName;
        if (password !== undefined && password !== '') addImageBody.password = password;
        if (expiration !== undefined) addImageBody.expiration = expiration;

        try {
            const addResponse = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: 'https://api.pdf.co/v1/pdf/edit/add',
                headers: {
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: addImageBody,
            });

            if (addResponse.body.error) {
                const errorBody = addResponse.body as PdfCoErrorResponse;
                throw new Error(`PDF.co Add Image Error: Status ${errorBody.status}. ${errorBody.message || 'Unknown error.'}`);
            }

            // Return the successful response containing the final PDF URL
            return addResponse.body as PdfCoSuccessResponse;

        } catch (error) {
            if (error instanceof HttpError) {
                const responseBody = error.response?.body as (PdfCoErrorResponse | undefined);
                 throw new Error(`HTTP Error adding barcode image to PDF: ${error.message}. ${responseBody?.message ? 'Server message: ' + responseBody.message : 'Raw response: ' + JSON.stringify(responseBody)}`);
            }
            throw error; // Re-throw other errors
        }
    },
});
