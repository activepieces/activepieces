import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpError } from "@activepieces/pieces-common";
import { PdfCoSuccessResponse, PdfCoErrorResponse } from "../common/types";
import { pdfCoAuth } from "../../index";
import { BASE_URL } from "../common/props";
interface PdfConvertFromHtmlRequestBody {
    html: string;
    async: boolean;
    name?: string;
    margins?: string; // e.g., "10px", "5mm 5mm 5mm 5mm"
    paperSize?: string; // "A4", "Letter", "200mm 300mm", etc.
    orientation?: 'Portrait' | 'Landscape';
    printBackground?: boolean;
    mediaType?: 'print' | 'screen' | 'none';
    header?: string; // HTML content
    footer?: string; // HTML content
    expiration?: number;
    profiles?: Record<string, unknown>;
    DoNotWaitFullLoad?:boolean
}

export const convertHtmlToPdf = createAction({
    name: 'convert_html_to_pdf',
    displayName: 'Convert HTML to PDF',
    description: 'Convert HTML code into a downloadable PDF document.',
    auth: pdfCoAuth,
    props: {
        html: Property.LongText({
            displayName: 'HTML Content',
            description: 'The HTML code to convert to PDF.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Desired name for the output PDF file (e.g., "result.pdf").',
            required: false,
        }),
        margins: Property.ShortText({
            displayName: 'Margins',
            description: 'CSS style margins (e.g., "10px", "5mm 5mm 5mm 5mm" for top, right, bottom, left).',
            required: false,
        }),
        paperSize: Property.StaticDropdown({
            displayName: 'Paper Size',
            description: 'Select a paper size. For custom sizes, input the value directly (e.g., \'200mm 300mm\') if your desired size isn\'t listed. Refer to PDF.co docs.',
            required: false,
            options: {
                    disabled: false,
                    placeholder: 'Select paper size or input custom',
                    options: [
                        { label: "A4 (Default)", value: "A4" },
                        { label: "Letter", value: "Letter" },
                        { label: "Legal", value: "Legal" },
                        { label: "Tabloid", value: "Tabloid" },
                        { label: "Ledger", value: "Ledger" },
                        { label: "A0", value: "A0" },
                        { label: "A1", value: "A1" },
                        { label: "A2", value: "A2" },
                        { label: "A3", value: "A3" },
                        { label: "A5", value: "A5" },
                        { label: "A6", value: "A6" },
                    ] 
                }
        }),
        orientation: Property.StaticDropdown ({
            displayName: 'Orientation',
            description: 'Set page orientation.',
            required: false,
            options:  {
                    disabled: false,
                    placeholder: 'Portrait (Default)',
                    options: [
                        { label: "Portrait (Default)", value: "Portrait" },
                        { label: "Landscape", value: "Landscape" },
                    ] ,
                }
        }),
        printBackground: Property.Checkbox({
            displayName: 'Print Background ?',
            description: 'Set to true to print background graphics and colors (default is true).',
            required: false,
            defaultValue: true,
        }),
        mediaType: Property.StaticDropdown({
            displayName: 'Media Type',
            description: 'CSS media type to emulate.',
            required: false,
            options:  {
                    disabled: false,
                    placeholder: 'print (Default)',
                    options: [
                        { label: "print (Default)", value: "print" },
                        { label: "screen", value: "screen" },
                        { label: "none", value: "none" },
                    ],
            }
        }),
        header: Property.LongText({
            displayName: 'Header HTML',
            description: 'HTML content for the page header.',
            required: false,
        }),
        footer: Property.LongText({
            displayName: 'Footer HTML',
            description: 'HTML content for the page footer.',
            required: false,
        }),
        doNotWaitFullLoad:Property.Checkbox({
            displayName:'Do not wait till full page load ?',
            required:false
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

        const requestBody: PdfConvertFromHtmlRequestBody = {
            html: propsValue.html,
            async: false,
            DoNotWaitFullLoad:propsValue.doNotWaitFullLoad
        };

        if (propsValue.name !== undefined && propsValue.name !== '') requestBody.name = propsValue.name;
        if (propsValue.margins !== undefined && propsValue.margins !== '') requestBody.margins = propsValue.margins;
        if (propsValue.paperSize !== undefined) requestBody.paperSize = propsValue.paperSize;
        if (propsValue.orientation !== undefined) requestBody.orientation = propsValue.orientation as 'Portrait' | 'Landscape';
        if (propsValue.printBackground !== undefined) requestBody.printBackground = propsValue.printBackground;
        if (propsValue.mediaType !== undefined) requestBody.mediaType = propsValue.mediaType as  'print' | 'screen' | 'none';
        if (propsValue.header !== undefined && propsValue.header !== '') requestBody.header = propsValue.header;
        if (propsValue.footer !== undefined && propsValue.footer !== '') requestBody.footer = propsValue.footer;
        if (propsValue.expiration !== undefined) requestBody.expiration = propsValue.expiration;
        if (propsValue.profiles !== undefined && typeof propsValue.profiles === 'object' && propsValue.profiles !== null) {
            requestBody.profiles = propsValue.profiles as Record<string, unknown>;
        }

        try {
            const response = await httpClient.sendRequest<PdfCoSuccessResponse | PdfCoErrorResponse>({
                method: HttpMethod.POST,
                url: `${BASE_URL}/pdf/convert/from/html`,
                headers: {
                    'x-api-key': auth as string,
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            if (response.body.error) {
                const errorBody = response.body as PdfCoErrorResponse;
                let errorMessage = `PDF.co API Error (Convert HTML to PDF): Status ${errorBody.status}.`;
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
                let detailedMessage = `HTTP Error calling PDF.co API (Convert HTML to PDF): ${error.message}.`;
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
