import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessCommon, convertBinaryToBase64 } from '../common/client';

export const generatePdf = createAction({
    name: 'generate_pdf',
    displayName: 'Generate PDF',
    description: 'Convert a web page to PDF',
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The URL of the page to convert to PDF',
            required: false,
        }),
        html: Property.LongText({
            displayName: 'HTML Content',
            description: 'HTML content to render as PDF (alternative to URL)',
            required: false,
        }),
        format: Property.StaticDropdown({
            displayName: 'Paper Format',
            description: 'Paper format for the PDF',
            required: false,
            defaultValue: 'A4',
            options: {
                options: [
                    { label: 'A0', value: 'A0' },
                    { label: 'A1', value: 'A1' },
                    { label: 'A2', value: 'A2' },
                    { label: 'A3', value: 'A3' },
                    { label: 'A4', value: 'A4' },
                    { label: 'A5', value: 'A5' },
                    { label: 'A6', value: 'A6' },
                    { label: 'Letter', value: 'Letter' },
                    { label: 'Legal', value: 'Legal' },
                    { label: 'Ledger', value: 'Ledger' },
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
        waitForSelectorTimeout: Property.Number({
            displayName: 'Wait for Selector Timeout',
            description: 'Timeout in milliseconds for waiting for selector',
            required: false,
        }),
        waitForSelectorVisible: Property.Checkbox({
            displayName: 'Wait for Selector Visible',
            description: 'Wait for selector to be visible',
            required: false,
            defaultValue: true,
        }),
        waitForSelectorHidden: Property.Checkbox({
            displayName: 'Wait for Selector Hidden',
            description: 'Wait for selector to be hidden',
            required: false,
            defaultValue: false,
        }),
        preferCSSPageSize: Property.Checkbox({
            displayName: 'Prefer CSS Page Size',
            description: 'Give any CSS @page size declared in the page priority over format',
            required: false,
            defaultValue: false,
        }),
        pageRanges: Property.ShortText({
            displayName: 'Page Ranges',
            description: 'Paper ranges to print, e.g. "1-5, 8, 11-13"',
            required: false,
        }),
        width: Property.ShortText({
            displayName: 'Custom Width',
            description: 'Custom width of paper (e.g., "8.5in", "210mm")',
            required: false,
        }),
        height: Property.ShortText({
            displayName: 'Custom Height',
            description: 'Custom height of paper (e.g., "11in", "297mm")',
            required: false,
        }),
        omitBackground: Property.Checkbox({
            displayName: 'Omit Background',
            description: 'Hide default white background and allow transparent PDFs',
            required: false,
            defaultValue: false,
        }),
        tagged: Property.Checkbox({
            displayName: 'Tagged PDF',
            description: 'Generate tagged (accessible) PDF',
            required: false,
            defaultValue: false,
        }),
        outline: Property.Checkbox({
            displayName: 'Generate Outline',
            description: 'Generate document outline',
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
        waitForFunctionPolling: Property.ShortText({
            displayName: 'Wait for Function Polling',
            description: 'Polling interval for wait function ("raf", "mutation", or number in ms)',
            required: false,
        }),
        waitForFunctionTimeout: Property.Number({
            displayName: 'Wait for Function Timeout',
            description: 'Timeout in milliseconds for wait function (0 to disable)',
            required: false,
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Custom user agent string to use for the request',
            required: false,
        }),
        waitForTimeout: Property.Number({
            displayName: 'Wait Timeout (ms)',
            description: 'Timeout in milliseconds to wait before generating PDF',
            required: false,
        }),
        bestAttempt: Property.Checkbox({
            displayName: 'Best Attempt',
            description: 'Attempt to proceed when awaited events fail or timeout',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        if (!context.propsValue.url && !context.propsValue.html) {
            throw new Error('Either URL or HTML content must be provided');
        }

        if (context.propsValue.url && context.propsValue.html) {
            throw new Error('Cannot provide both URL and HTML content. Choose one.');
        }

        const requestBody: any = {
            options: {
                format: context.propsValue.format || 'A4',
                landscape: context.propsValue.landscape || false,
                printBackground: context.propsValue.printBackground !== false,
                displayHeaderFooter: context.propsValue.displayHeaderFooter || false,
            }
        };

        if (context.propsValue.url) {
            requestBody.url = context.propsValue.url;
        } else if (context.propsValue.html) {
            requestBody.html = context.propsValue.html;
        }

        if (context.propsValue.userAgent) {
            requestBody.userAgent = context.propsValue.userAgent;
        }

        if (context.propsValue.waitForTimeout) {
            requestBody.waitForTimeout = context.propsValue.waitForTimeout;
        }

        if (context.propsValue.bestAttempt) {
            requestBody.bestAttempt = context.propsValue.bestAttempt;
        }

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
            const waitForSelectorObj: any = {
                selector: context.propsValue.waitForSelector,
            };

            if (context.propsValue.waitForSelectorTimeout !== undefined) {
                waitForSelectorObj.timeout = context.propsValue.waitForSelectorTimeout;
            }

            if (context.propsValue.waitForSelectorVisible !== undefined) {
                waitForSelectorObj.visible = context.propsValue.waitForSelectorVisible;
            }

            if (context.propsValue.waitForSelectorHidden !== undefined) {
                waitForSelectorObj.hidden = context.propsValue.waitForSelectorHidden;
            }

            requestBody.options.waitForSelector = waitForSelectorObj;
        }

        if (context.propsValue.preferCSSPageSize) {
            requestBody.options.preferCSSPageSize = context.propsValue.preferCSSPageSize;
        }

        if (context.propsValue.pageRanges) {
            requestBody.options.pageRanges = context.propsValue.pageRanges;
        }

        if (context.propsValue.width) {
            requestBody.options.width = context.propsValue.width;
        }

        if (context.propsValue.height) {
            requestBody.options.height = context.propsValue.height;
        }

        if (context.propsValue.omitBackground) {
            requestBody.options.omitBackground = context.propsValue.omitBackground;
        }

        if (context.propsValue.tagged) {
            requestBody.options.tagged = context.propsValue.tagged;
        }

        if (context.propsValue.outline) {
            requestBody.options.outline = context.propsValue.outline;
        }

        if (context.propsValue.timeout) {
            requestBody.options.timeout = context.propsValue.timeout;
        }

        if (context.propsValue.waitForFunction) {
            const waitForFunctionObj: any = {
                fn: context.propsValue.waitForFunction,
            };

            if (context.propsValue.waitForFunctionPolling !== undefined) {
                waitForFunctionObj.polling = context.propsValue.waitForFunctionPolling;
            }

            if (context.propsValue.waitForFunctionTimeout !== undefined) {
                waitForFunctionObj.timeout = context.propsValue.waitForFunctionTimeout;
            }

            requestBody.options.waitForFunction = waitForFunctionObj;
        }

        const response = await browserlessCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/pdf',
            body: requestBody,
        });

        const fileName = 'document.pdf';
        
        let fileData: Buffer;
        
        if (response.body instanceof ArrayBuffer) {
            fileData = Buffer.from(response.body);
        } else if (Buffer.isBuffer(response.body)) {
            fileData = response.body;
        } else if (typeof response.body === 'string') {
            fileData = Buffer.from(response.body, 'latin1');
        } else {
            fileData = Buffer.from(String(response.body), 'latin1');
        }

        const file = await context.files.write({
            data: fileData,
            fileName: fileName,
        });

        return {
            success: true,
            file: file,
            pdfBase64: convertBinaryToBase64(fileData),
            metadata: {
                source: context.propsValue.url ? 'url' : 'html',
                url: context.propsValue.url || null,
                hasHtml: !!context.propsValue.html,
                format: context.propsValue.format || 'A4',
                landscape: context.propsValue.landscape || false,
                timestamp: new Date().toISOString(),
                fileName: fileName,
                contentType: 'application/pdf',
            }
        };
    },
});
