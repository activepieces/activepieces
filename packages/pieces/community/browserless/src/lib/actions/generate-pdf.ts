import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessCommon } from '../common/client';

export const generatePdf = createAction({
    name: 'generate_pdf',
    displayName: 'Generate PDF',
    description: 'Convert a web page to PDF',
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The URL of the page to convert to PDF',
            required: true,
        }),
        format: Property.StaticDropdown({
            displayName: 'Paper Format',
            description: 'Paper format for the PDF',
            required: false,
            defaultValue: 'A4',
            options: {
                options: [
                    { label: 'A4', value: 'A4' },
                    { label: 'A3', value: 'A3' },
                    { label: 'A5', value: 'A5' },
                    { label: 'Letter', value: 'Letter' },
                    { label: 'Legal', value: 'Legal' },
                    { label: 'Tabloid', value: 'Tabloid' }
                ]
            }
        }),
        landscape: Property.Checkbox({
            displayName: 'Landscape',
            description: 'Use landscape orientation',
            required: false,
            defaultValue: false,
        }),
        printBackground: Property.Checkbox({
            displayName: 'Print Background',
            description: 'Include background graphics',
            required: false,
            defaultValue: true,
        }),
        marginTop: Property.ShortText({
            displayName: 'Top Margin',
            description: 'Top margin (e.g., "10mm", "0.4in")',
            required: false,
        }),
        marginRight: Property.ShortText({
            displayName: 'Right Margin',
            description: 'Right margin (e.g., "10mm", "0.4in")',
            required: false,
        }),
        marginBottom: Property.ShortText({
            displayName: 'Bottom Margin',
            description: 'Bottom margin (e.g., "10mm", "0.4in")',
            required: false,
        }),
        marginLeft: Property.ShortText({
            displayName: 'Left Margin',
            description: 'Left margin (e.g., "10mm", "0.4in")',
            required: false,
        }),
        headerTemplate: Property.LongText({
            displayName: 'Header Template',
            description: 'HTML template for the print header',
            required: false,
        }),
        footerTemplate: Property.LongText({
            displayName: 'Footer Template',
            description: 'HTML template for the print footer',
            required: false,
        }),
        displayHeaderFooter: Property.Checkbox({
            displayName: 'Display Header/Footer',
            description: 'Display header and footer',
            required: false,
            defaultValue: false,
        }),
        scale: Property.Number({
            displayName: 'Scale',
            description: 'Scale of the webpage rendering (0.1 - 2.0)',
            required: false,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before generating PDF',
            required: false,
        }),
        preferCSSPageSize: Property.Checkbox({
            displayName: 'Prefer CSS Page Size',
            description: 'Give any CSS @page size declared in the page priority over format',
            required: false,
            defaultValue: false,
        }),
        timeout: Property.Number({
            displayName: 'Timeout (ms)',
            description: 'Maximum time to wait for the page to load',
            required: false,
        }),
        waitForFunction: Property.LongText({
            displayName: 'Wait for Function',
            description: 'JavaScript function to wait for before generating PDF',
            required: false,
        }),
    },
    async run(context) {
        const requestBody: any = {
            url: context.propsValue.url,
            options: {
                format: context.propsValue.format || 'A4',
                landscape: context.propsValue.landscape || false,
                printBackground: context.propsValue.printBackground !== false,
                displayHeaderFooter: context.propsValue.displayHeaderFooter || false,
            }
        };

        const margin: any = {};
        if (context.propsValue.marginTop) margin.top = context.propsValue.marginTop;
        if (context.propsValue.marginRight) margin.right = context.propsValue.marginRight;
        if (context.propsValue.marginBottom) margin.bottom = context.propsValue.marginBottom;
        if (context.propsValue.marginLeft) margin.left = context.propsValue.marginLeft;
        
        if (Object.keys(margin).length > 0) {
            requestBody.options.margin = margin;
        }

        if (context.propsValue.headerTemplate) {
            requestBody.options.headerTemplate = context.propsValue.headerTemplate;
        }

        if (context.propsValue.footerTemplate) {
            requestBody.options.footerTemplate = context.propsValue.footerTemplate;
        }

        if (context.propsValue.scale) {
            requestBody.options.scale = Math.max(0.1, Math.min(2.0, context.propsValue.scale));
        }

        if (context.propsValue.waitForSelector) {
            requestBody.options.waitForSelector = context.propsValue.waitForSelector;
        }

        if (context.propsValue.preferCSSPageSize) {
            requestBody.options.preferCSSPageSize = context.propsValue.preferCSSPageSize;
        }

        if (context.propsValue.timeout) {
            requestBody.options.timeout = context.propsValue.timeout;
        }

        if (context.propsValue.waitForFunction) {
            requestBody.options.waitForFunction = context.propsValue.waitForFunction;
        }

        const response = await browserlessCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/pdf',
            body: requestBody,
        });

        return {
            success: true,
            pdf: response.body,
            metadata: {
                url: context.propsValue.url,
                format: context.propsValue.format || 'A4',
                landscape: context.propsValue.landscape || false,
                timestamp: new Date().toISOString(),
            }
        };
    },
});
