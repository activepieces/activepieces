import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../../common/auth';
import { browserlessApi } from '../../common/client';
import { browserlessBody, browserlessProps } from '../../common/props';
import { browserlessOutputSchemas } from '../../output-schemas';

export const takeScreenshot = createAction({
    auth: browserlessAuth,
    name: 'take_screenshot',
    classification: 'READ',
    displayName: 'Take Screenshot (File Only)',
    description: 'Screenshot a web page or HTML and return only the stored image file.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Renders a URL or raw HTML in a headless browser and stores a PNG, JPEG or WebP screenshot, returning only the file link plus name, size and MIME type (no base64 in the output). Use when you need an image of a page; to read page text use Smart Scrape. Give exactly one of url or html. Each call renders again and stores a new file.',
        idempotent: false,
    },
    props: {
        url: browserlessProps.url({ required: false, description: 'The page to capture, for example https://example.com. Leave empty when you pass HTML.' }),
        html: Property.LongText({
            displayName: 'HTML',
            description: 'Raw HTML to render instead of a URL.',
            required: false,
        }),
        imageType: Property.StaticDropdown({
            displayName: 'Image Type',
            description: 'Image format (default PNG).',
            required: false,
            options: {
                options: [
                    { label: 'PNG', value: 'png' },
                    { label: 'JPEG', value: 'jpeg' },
                    { label: 'WebP', value: 'webp' },
                ],
            },
        }),
        fullPage: Property.Checkbox({
            displayName: 'Full Page',
            description: 'Capture the whole scrollable page instead of the visible viewport.',
            required: false,
            defaultValue: false,
        }),
        quality: Property.Number({
            displayName: 'Quality',
            description: 'JPEG/WebP quality 0-100.',
            required: false,
        }),
        width: Property.Number({
            displayName: 'Viewport Width',
            description: 'Browser width in pixels (set together with height).',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Viewport Height',
            description: 'Browser height in pixels (set together with width).',
            required: false,
        }),
        selector: Property.ShortText({
            displayName: 'Element Selector',
            description: 'Capture only the element matching this CSS selector.',
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
        const imageType = browserlessBody.nonEmpty(props.imageType) ? props.imageType : 'png';
        const quality = browserlessBody.optionalNumber({ value: props.quality, label: 'Quality', min: 0, max: 100 });
        const width = browserlessBody.optionalNumber({ value: props.width, label: 'Viewport Width', min: 1 });
        const height = browserlessBody.optionalNumber({ value: props.height, label: 'Viewport Height', min: 1 });
        if ((width === undefined) !== (height === undefined)) {
            throw new Error('Set both Viewport Width and Viewport Height, or leave both empty.');
        }
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });

        const response = await browserlessApi.request({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/screenshot',
            body: {
                ...source,
                options: {
                    type: imageType,
                    fullPage: props.fullPage === true,
                    ...(quality !== undefined && imageType !== 'png' ? { quality } : {}),
                },
                ...(width !== undefined && height !== undefined ? { viewport: { width, height } } : {}),
                ...(browserlessBody.nonEmpty(props.selector) ? { selector: props.selector.trim() } : {}),
                ...browserlessBody.pageOptions({ waitForSelector: props.waitForSelector, waitForTimeout: props.waitForTimeout }),
            },
            query: { timeout },
            responseType: 'arraybuffer',
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Take Screenshot',
        });

        const data = browserlessApi.toBuffer(response.body);
        const fileName = `screenshot.${imageType === 'jpeg' ? 'jpg' : imageType}`;
        const file = await context.files.write({ fileName, data });
        return {
            file,
            file_name: fileName,
            size_bytes: data.length,
            mime_type: `image/${imageType}`,
            source: 'url' in source ? source.url : 'html',
            site_status_code: browserlessApi.siteResponse(response.headers).site_status_code,
        };
    },
});
