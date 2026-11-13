import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessOutputSchemas } from '../output-schemas';

export const generatePdf = createAction({
    name: 'generate_pdf',
    classification: 'READ',
    displayName: 'Generate PDF',
    description: 'Convert a web page to PDF',
    audience: 'human',
    aiMetadata: { description: 'Renders content in a headless browser and returns it as a PDF file. Source the content either from a page URL or from a raw HTML string (provide exactly one, not both). Use to produce a printable PDF of a page or supplied markup, with control over paper format, orientation, margins, and headers/footers. Not idempotent: each call runs a fresh headless-browser render, so repeating it produces a new PDF of the page or markup as it renders at that moment.', idempotent: false },
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
                    { label: 'Tabloid', value: 'Tabloid' },
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
            description: 'Maximum time in milliseconds to wait for the page to load',
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
    outputSchema: browserlessOutputSchemas.generatePdf,
    async run(context) {
        const props = context.propsValue;
        const hasUrl = browserlessBody.nonEmpty(props.url);
        const hasHtml = browserlessBody.nonEmpty(props.html);
        if (!hasUrl && !hasHtml) {
            throw new Error('Either URL or HTML content must be provided');
        }
        if (hasUrl && hasHtml) {
            throw new Error('Cannot provide both URL and HTML content. Choose one.');
        }
        const scale = browserlessBody.optionalNumber({ value: props.scale, label: 'Scale', min: 0.1, max: 2 });
        const navigationTimeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 0 });
        const waitForTimeout = browserlessBody.optionalNumber({ value: props.waitForTimeout, label: 'Wait Timeout', min: 0 });
        const selectorTimeout = browserlessBody.optionalNumber({ value: props.waitForSelectorTimeout, label: 'Wait for Selector Timeout', min: 0 });
        const functionTimeout = browserlessBody.optionalNumber({ value: props.waitForFunctionTimeout, label: 'Wait for Function Timeout', min: 0 });

        const margin = {
            ...(browserlessBody.nonEmpty(props.marginTop) ? { top: props.marginTop } : {}),
            ...(browserlessBody.nonEmpty(props.marginRight) ? { right: props.marginRight } : {}),
            ...(browserlessBody.nonEmpty(props.marginBottom) ? { bottom: props.marginBottom } : {}),
            ...(browserlessBody.nonEmpty(props.marginLeft) ? { left: props.marginLeft } : {}),
        };

        const options = {
            format: props.format || 'A4',
            landscape: props.landscape === true,
            printBackground: props.printBackground !== false,
            displayHeaderFooter: props.displayHeaderFooter === true,
            ...(Object.keys(margin).length > 0 ? { margin } : {}),
            ...(browserlessBody.nonEmpty(props.headerTemplate) ? { headerTemplate: props.headerTemplate } : {}),
            ...(browserlessBody.nonEmpty(props.footerTemplate) ? { footerTemplate: props.footerTemplate } : {}),
            ...(scale !== undefined ? { scale } : {}),
            ...(props.preferCSSPageSize === true ? { preferCSSPageSize: true } : {}),
            ...(browserlessBody.nonEmpty(props.pageRanges) ? { pageRanges: props.pageRanges } : {}),
            ...(browserlessBody.nonEmpty(props.width) ? { width: props.width } : {}),
            ...(browserlessBody.nonEmpty(props.height) ? { height: props.height } : {}),
            ...(props.omitBackground === true ? { omitBackground: true } : {}),
            ...(props.tagged === true ? { tagged: true } : {}),
            ...(props.outline === true ? { outline: true } : {}),
        };

        const waitForSelector = browserlessBody.nonEmpty(props.waitForSelector)
            ? {
                  selector: props.waitForSelector.trim(),
                  ...(selectorTimeout !== undefined ? { timeout: selectorTimeout } : {}),
                  ...(props.waitForSelectorHidden === true ? { hidden: true } : props.waitForSelectorVisible === true ? { visible: true } : {}),
              }
            : undefined;

        const waitForFunction = browserlessBody.nonEmpty(props.waitForFunction)
            ? {
                  fn: props.waitForFunction,
                  ...(browserlessBody.nonEmpty(props.waitForFunctionPolling) ? { polling: pollingValue(props.waitForFunctionPolling) } : {}),
                  ...(functionTimeout !== undefined ? { timeout: functionTimeout } : {}),
              }
            : undefined;

        const requestBody = {
            ...(hasUrl ? { url: props.url } : { html: props.html }),
            options,
            ...(navigationTimeout !== undefined ? { gotoOptions: { timeout: navigationTimeout } } : {}),
            ...(waitForSelector !== undefined ? { waitForSelector } : {}),
            ...(waitForFunction !== undefined ? { waitForFunction } : {}),
            ...(waitForTimeout !== undefined ? { waitForTimeout } : {}),
            ...(browserlessBody.nonEmpty(props.userAgent) ? { userAgent: { userAgent: props.userAgent.trim() } } : {}),
            ...(props.bestAttempt === true ? { bestAttempt: true } : {}),
        };

        const response = await browserlessApi.request({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/pdf',
            body: requestBody,
            responseType: 'arraybuffer',
            operation: 'Generate PDF',
        });

        const fileData = browserlessApi.toBuffer(response.body);
        const fileName = 'document.pdf';
        const file = await context.files.write({ data: fileData, fileName });
        const site = browserlessApi.siteResponse(response.headers);

        return {
            success: true,
            file,
            pdfBase64: fileData.toString('base64'),
            metadata: {
                source: hasUrl ? 'url' : 'html',
                url: hasUrl ? props.url : null,
                hasHtml,
                format: props.format || 'A4',
                landscape: props.landscape === true,
                timestamp: new Date().toISOString(),
                fileName,
                contentType: 'application/pdf',
                sizeBytes: fileData.length,
                siteStatusCode: site.site_status_code,
            },
        };
    },
});

function pollingValue(value: string): string | number {
    const trimmed = value.trim();
    return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}
