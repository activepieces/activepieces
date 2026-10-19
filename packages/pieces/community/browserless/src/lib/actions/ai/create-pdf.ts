import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../../common/auth';
import { browserlessApi } from '../../common/client';
import { browserlessBody, browserlessProps } from '../../common/props';
import { browserlessOutputSchemas } from '../../output-schemas';

export const createPdf = createAction({
    auth: browserlessAuth,
    name: 'create_pdf',
    classification: 'READ',
    displayName: 'Create PDF (File Only)',
    description: 'Render a web page or HTML to PDF and return only the stored file.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Renders a URL or raw HTML in a headless browser and stores it as a PDF, returning only the file link plus name, size and MIME type (no base64 in the output). Use to produce a printable document, for example from HTML you wrote; give exactly one of url or html. Each call renders again and stores a new file.',
        idempotent: false,
    },
    props: {
        url: browserlessProps.url({ required: false, description: 'The page to convert, for example https://example.com. Leave empty when you pass HTML.' }),
        html: Property.LongText({
            displayName: 'HTML',
            description: 'Raw HTML to render instead of a URL.',
            required: false,
        }),
        format: Property.StaticDropdown({
            displayName: 'Paper Format',
            description: 'Paper size (default A4).',
            required: false,
            options: {
                options: ['A3', 'A4', 'A5', 'Letter', 'Legal', 'Tabloid'].map((value) => ({ label: value, value })),
            },
        }),
        landscape: Property.Checkbox({
            displayName: 'Landscape',
            description: 'Use landscape orientation.',
            required: false,
            defaultValue: false,
        }),
        printBackground: Property.Checkbox({
            displayName: 'Print Background',
            description: 'Include background colours and images (default on).',
            required: false,
            defaultValue: true,
        }),
        margin: Property.ShortText({
            displayName: 'Margin',
            description: 'One margin for all sides, for example `10mm` or `0.5in`.',
            required: false,
        }),
        waitForSelector: browserlessProps.waitForSelector(),
        waitForTimeout: browserlessProps.waitForTimeout(),
        timeout: browserlessProps.sessionTimeout(),
    },
    outputSchema: browserlessOutputSchemas.fileOnly,
    async run(context) {
        const props = context.propsValue;
        const source = browserlessBody.pageSource({ url: props.url, html: props.html });
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });
        const margin = browserlessBody.nonEmpty(props.margin) ? props.margin.trim() : undefined;

        const response = await browserlessApi.request({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/pdf',
            body: {
                ...source,
                options: {
                    format: browserlessBody.nonEmpty(props.format) ? props.format : 'A4',
                    landscape: props.landscape === true,
                    printBackground: props.printBackground !== false,
                    ...(margin !== undefined ? { margin: { top: margin, right: margin, bottom: margin, left: margin } } : {}),
                },
                ...browserlessBody.pageOptions({ waitForSelector: props.waitForSelector, waitForTimeout: props.waitForTimeout }),
            },
            query: { timeout },
            responseType: 'arraybuffer',
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Create PDF',
        });

        const data = browserlessApi.toBuffer(response.body);
        const fileName = 'document.pdf';
        const file = await context.files.write({ fileName, data });
        return {
            file,
            file_name: fileName,
            size_bytes: data.length,
            mime_type: 'application/pdf',
            source: 'url' in source ? source.url : 'html',
            site_status_code: browserlessApi.siteResponse(response.headers).site_status_code,
        };
    },
});
