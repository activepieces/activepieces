import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { PDF_CO_DEFAULTS, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const convertHtmlToPdf = createAction({
    name: 'convert_html_to_pdf',
    classification: 'WRITE',
    displayName: 'Convert HTML to PDF',
    description: 'Convert HTML code into a downloadable PDF document.',
    audience: 'both',
    aiMetadata: {
        description:
            'Renders a block of HTML into a new PDF document, with optional paper size, orientation, margins, header/footer, and media-type controls. Use when an agent needs to turn HTML markup into a downloadable PDF. Each call generates a new output file and consumes credits, so it is not idempotent.',
        idempotent: false,
    },
    auth: pdfCoAuth,
    outputSchema: pdfCoOutputSchemas.legacyEdit,
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
            description: 'Select a standard paper size. For another size, fill Custom Paper Size below.',
            required: false,
            options: {
                    disabled: false,
                    placeholder: 'Select paper size',
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
        }),
        customPaperSize: Property.ShortText({
            displayName: 'Custom Paper Size',
            description: 'Width and height with units, e.g. "200mm 300mm" or "8.5in 11in". Overrides Paper Size when set.',
            required: false,
        }),
        saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnExistingActions }),
    },
    async run({ auth, propsValue, files }) {
        const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
        const customPaperSize = text(propsValue.customPaperSize)?.trim();
        const orientation = text(propsValue.orientation);
        const mediaType = text(propsValue.mediaType);
        const profiles = pdfCoClient.serializeProfiles(propsValue.profiles);
        const requestBody: Record<string, unknown> = {
            html: propsValue.html,
            async: false,
            DoNotWaitFullLoad: propsValue.doNotWaitFullLoad,
            ...(text(propsValue.name) === undefined ? {} : { name: propsValue.name }),
            ...(text(propsValue.margins) === undefined ? {} : { margins: propsValue.margins }),
            ...(customPaperSize !== undefined && customPaperSize !== ''
                ? { paperSize: customPaperSize }
                : propsValue.paperSize === undefined
                  ? {}
                  : { paperSize: propsValue.paperSize }),
            ...(orientation === undefined ? {} : { orientation }),
            ...(propsValue.printBackground === undefined ? {} : { printBackground: propsValue.printBackground }),
            ...(mediaType === undefined ? {} : { mediaType }),
            ...(text(propsValue.header) === undefined ? {} : { header: propsValue.header }),
            ...(text(propsValue.footer) === undefined ? {} : { footer: propsValue.footer }),
            ...(propsValue.expiration === undefined ? {} : { expiration: propsValue.expiration }),
            ...(profiles === undefined ? {} : { profiles }),
        };
        const body = pdfCoClient.readRecord(
            await pdfCoClient.request<unknown>({
                apiKey: pdfCoClient.apiKeyOf(auth),
                method: HttpMethod.POST,
                path: '/v1/pdf/convert/from/html',
                body: requestBody,
            }),
        );
        return pdfCoJobs.legacyEditOutput({ body, files, saveOutputFile: propsValue.saveOutputFile, fileName: propsValue.name });
    },
});
