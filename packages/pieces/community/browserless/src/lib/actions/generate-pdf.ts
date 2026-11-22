import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessOutputSchemas } from '../output-schemas';

export const generatePdf = createAction({
    name: 'generate_pdf',
    classification: 'READ',
    displayName: 'Generate PDF',
    description: 'Convert a web page or HTML to a PDF file.',
    audience: 'human',
    aiMetadata: { description: 'Renders content in a headless browser and returns it as a PDF file. Source the content either from a page URL or from a raw HTML string (provide exactly one, not both). Use to produce a printable PDF of a page or supplied markup, with control over paper format, orientation, margins, and headers/footers. Not idempotent: each call runs a fresh headless-browser render, so repeating it produces a new PDF of the page or markup as it renders at that moment.', idempotent: false },
    auth: browserlessAuth,
    propertyGroups: [
        {
            key: 'source',
            display: 'section',
            label: 'Source',
            icon: 'send',
            props: ['sourceInfo', 'url', 'html'],
        },
        {
            key: 'paper',
            display: 'section',
            label: 'Paper',
            icon: 'file',
            props: ['format', 'landscape', 'width', 'height', 'scale', 'pageRanges', 'preferCSSPageSize', 'printBackground'],
        },
        {
            key: 'margins',
            display: 'section',
            label: 'Margins',
            icon: 'sliders',
            props: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
        },
        {
            key: 'headerFooter',
            display: 'section',
            label: 'Header and footer',
            icon: 'text',
            props: ['displayHeaderFooter', 'headerTemplate', 'footerTemplate'],
        },
        {
            key: 'wait',
            display: 'section',
            label: 'Wait for the page',
            icon: 'calendar',
            props: ['waitForSelector', 'waitForTimeout', 'timeout'],
        },
    ],
    props: {
        sourceInfo: Property.MarkDown({
            value: 'Fill in either URL or HTML, not both.',
            variant: MarkdownVariant.INFO,
        }),
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The page to convert.',
            placeholder: 'https://example.com',
            required: false,
        }),
        html: Property.LongText({
            displayName: 'HTML',
            description: 'HTML to render instead of a URL.',
            required: false,
        }),
        format: Property.StaticDropdown({
            displayName: 'Paper Size',
            description: 'Standard paper size. Ignored when Custom Width or Height is set.',
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
            description: 'Turn the page sideways.',
            required: false,
            defaultValue: false,
        }),
        printBackground: Property.Checkbox({
            displayName: 'Print Background',
            description: 'Include background colors and images.',
            required: false,
            defaultValue: true,
        }),
        marginTop: Property.ShortText({
            displayName: 'Top Margin',
            description: 'Any CSS length.',
            placeholder: '10mm',
            required: false,
            width: 'half',
        }),
        marginRight: Property.ShortText({
            displayName: 'Right Margin',
            description: 'Any CSS length.',
            placeholder: '10mm',
            required: false,
            width: 'half',
        }),
        marginBottom: Property.ShortText({
            displayName: 'Bottom Margin',
            description: 'Any CSS length.',
            placeholder: '10mm',
            required: false,
            width: 'half',
        }),
        marginLeft: Property.ShortText({
            displayName: 'Left Margin',
            description: 'Any CSS length.',
            placeholder: '10mm',
            required: false,
            width: 'half',
        }),
        headerTemplate: Property.LongText({
            displayName: 'Header Template',
            description: 'HTML for the header on each page; needs Show Header and Footer.',
            required: false,
        }),
        footerTemplate: Property.LongText({
            displayName: 'Footer Template',
            description: 'HTML for the footer on each page; needs Show Header and Footer.',
            required: false,
        }),
        displayHeaderFooter: Property.Checkbox({
            displayName: 'Show Header and Footer',
            description: 'Add a header and footer to every page.',
            required: false,
            defaultValue: false,
        }),
        scale: Property.Number({
            displayName: 'Scale',
            description: 'Zoom of the page rendering, from 0.1 to 2.',
            required: false,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before creating the PDF.',
            placeholder: '#content',
            required: false,
        }),
        waitForSelectorTimeout: Property.Number({
            displayName: 'Selector Timeout',
            description: 'Milliseconds to wait for the selector.',
            required: false,
            advanced: true,
        }),
        waitForSelectorVisible: Property.Checkbox({
            displayName: 'Selector Must Be Visible',
            description: 'Wait until the selector is visible.',
            required: false,
            defaultValue: true,
            advanced: true,
        }),
        waitForSelectorHidden: Property.Checkbox({
            displayName: 'Selector Must Be Hidden',
            description: 'Wait until the selector is hidden instead.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        preferCSSPageSize: Property.Checkbox({
            displayName: 'Use CSS Page Size',
            description: 'Let a CSS @page size in the page override Paper Size.',
            required: false,
            defaultValue: false,
        }),
        pageRanges: Property.ShortText({
            displayName: 'Page Ranges',
            description: 'Pages to include. Empty: all pages.',
            placeholder: '1-5, 8, 11-13',
            required: false,
        }),
        width: Property.ShortText({
            displayName: 'Custom Width',
            description: 'Any CSS length.',
            placeholder: '8.5in',
            required: false,
            width: 'half',
        }),
        height: Property.ShortText({
            displayName: 'Custom Height',
            description: 'Any CSS length.',
            placeholder: '11in',
            required: false,
            width: 'half',
        }),
        omitBackground: Property.Checkbox({
            displayName: 'Transparent Background',
            description: 'Drop the default white background.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        tagged: Property.Checkbox({
            displayName: 'Accessible PDF',
            description: 'Add tags that screen readers use.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        outline: Property.Checkbox({
            displayName: 'Add Outline',
            description: 'Add a clickable table of contents from the headings.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        timeout: Property.Number({
            displayName: 'Page Load Timeout',
            description: 'Milliseconds to wait for the page to load.',
            required: false,
        }),
        waitForFunction: Property.LongText({
            displayName: 'Wait for Function',
            description: 'JavaScript that returns true when the page is ready.',
            required: false,
            advanced: true,
        }),
        waitForFunctionPolling: Property.ShortText({
            displayName: 'Function Polling',
            description: 'raf, mutation, or a number of milliseconds between checks.',
            required: false,
            advanced: true,
        }),
        waitForFunctionTimeout: Property.Number({
            displayName: 'Function Timeout',
            description: 'Milliseconds to wait for the function. 0 means no limit.',
            required: false,
            advanced: true,
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Browser user agent string to send instead of the default.',
            required: false,
            advanced: true,
        }),
        waitForTimeout: Property.Number({
            displayName: 'Extra Wait',
            description: 'Milliseconds to wait after the page loads, for late content.',
            required: false,
        }),
        bestAttempt: Property.Checkbox({
            displayName: 'Best Attempt',
            description: 'Use what has loaded when a wait times out, instead of failing.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
    },
    outputSchema: browserlessOutputSchemas.generatePdf,
    async run(context) {
        const props = context.propsValue;
        const hasUrl = browserlessBody.nonEmpty(props.url);
        const hasHtml = browserlessBody.nonEmpty(props.html);
        if (!hasUrl && !hasHtml) {
            throw new Error('Fill in either URL or HTML.');
        }
        if (hasUrl && hasHtml) {
            throw new Error('Fill in either URL or HTML, not both.');
        }
        const scale = browserlessBody.optionalNumber({ value: props.scale, label: 'Scale', min: 0.1, max: 2 });
        const navigationTimeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Page Load Timeout', min: 0 });
        const waitForTimeout = browserlessBody.optionalNumber({ value: props.waitForTimeout, label: 'Extra Wait', min: 0 });
        const selectorTimeout = browserlessBody.optionalNumber({ value: props.waitForSelectorTimeout, label: 'Selector Timeout', min: 0 });
        const functionTimeout = browserlessBody.optionalNumber({ value: props.waitForFunctionTimeout, label: 'Function Timeout', min: 0 });

        const margin = {
            ...(browserlessBody.nonEmpty(props.marginTop) ? { top: props.marginTop } : {}),
            ...(browserlessBody.nonEmpty(props.marginRight) ? { right: props.marginRight } : {}),
            ...(browserlessBody.nonEmpty(props.marginBottom) ? { bottom: props.marginBottom } : {}),
            ...(browserlessBody.nonEmpty(props.marginLeft) ? { left: props.marginLeft } : {}),
        };

        const options = {
            ...(browserlessBody.nonEmpty(props.width) || browserlessBody.nonEmpty(props.height) ? {} : { format: props.format || 'A4' }),
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
