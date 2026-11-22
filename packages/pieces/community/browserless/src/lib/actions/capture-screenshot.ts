import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessOutputSchemas } from '../output-schemas';

export const captureScreenshot = createAction({
    name: 'capture_screenshot',
    classification: 'READ',
    displayName: 'Capture Screenshot',
    description: 'Take a screenshot of a web page.',
    audience: 'human',
    aiMetadata: { description: 'Renders a web page in a headless browser and returns a PNG, JPEG or WebP screenshot as a file. Use to capture the visual state of a public URL; for page text use Get Page Content or Smart Scrape instead. The page URL is required, and options like full-page capture, viewport size, clipping region, and waiting for a CSS selector control what is rendered. Each call renders the live page again and stores a new file (about 1 Browserless unit per 30 s).', idempotent: false },
    auth: browserlessAuth,
    propertyGroups: [
        {
            key: 'page',
            display: 'section',
            label: 'Page',
            icon: 'send',
            props: ['url', 'waitForSelector', 'delay'],
        },
        {
            key: 'image',
            display: 'section',
            label: 'Image',
            icon: 'file',
            props: ['imageType', 'qualityInfo', 'quality', 'fullPage', 'omitBackground'],
        },
        {
            key: 'viewport',
            display: 'section',
            label: 'Viewport',
            icon: 'sliders',
            props: ['viewportInfo', 'width', 'height'],
        },
        {
            key: 'crop',
            display: 'section',
            label: 'Crop area',
            icon: 'filter',
            props: ['cropInfo', 'clipX', 'clipY', 'clipWidth', 'clipHeight'],
        },
    ],
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The page to capture.',
            placeholder: 'https://example.com',
            required: true,
        }),
        imageType: Property.StaticDropdown({
            displayName: 'Image Format',
            description: 'File format of the screenshot.',
            required: false,
            defaultValue: 'png',
            display: 'cards',
            options: {
                options: [
                    { label: 'PNG', value: 'png', description: 'Lossless' },
                    { label: 'JPEG', value: 'jpeg', description: 'Smaller file' },
                    { label: 'WebP', value: 'webp', description: 'Smallest file' },
                ]
            }
        }),
        qualityInfo: Property.MarkDown({
            value: 'Quality applies to JPEG and WebP only.',
            variant: MarkdownVariant.INFO,
        }),
        quality: Property.Number({
            displayName: 'Quality',
            description: 'Image quality from 0 to 100.',
            required: false,
        }),
        fullPage: Property.Checkbox({
            displayName: 'Full Page',
            description: 'Capture the whole scrollable page, not just the viewport.',
            required: false,
            defaultValue: false,
        }),
        viewportInfo: Property.MarkDown({
            value: 'Set both width and height, or leave both empty.',
            variant: MarkdownVariant.INFO,
        }),
        width: Property.Number({
            displayName: 'Viewport Width',
            description: 'Pixels.',
            required: false,
            width: 'half',
        }),
        height: Property.Number({
            displayName: 'Viewport Height',
            description: 'Pixels.',
            required: false,
            width: 'half',
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before taking the screenshot.',
            placeholder: '#content',
            required: false,
        }),
        delay: Property.Number({
            displayName: 'Extra Wait',
            description: 'Milliseconds to wait after the page loads, for late content.',
            required: false,
        }),
        omitBackground: Property.Checkbox({
            displayName: 'Transparent Background',
            description: 'PNG and WebP only: drop the default white background.',
            required: false,
            defaultValue: false,
        }),
        cropInfo: Property.MarkDown({
            value: 'Set all four crop values or none, and turn off Full Page to crop.',
            variant: MarkdownVariant.INFO,
        }),
        clipX: Property.Number({
            displayName: 'Crop X',
            description: 'Pixels from the left.',
            required: false,
            width: 'half',
        }),
        clipY: Property.Number({
            displayName: 'Crop Y',
            description: 'Pixels from the top.',
            required: false,
            width: 'half',
        }),
        clipWidth: Property.Number({
            displayName: 'Crop Width',
            description: 'Pixels.',
            required: false,
            width: 'half',
        }),
        clipHeight: Property.Number({
            displayName: 'Crop Height',
            description: 'Pixels.',
            required: false,
            width: 'half',
        }),
    },
    outputSchema: browserlessOutputSchemas.captureScreenshot,
    async run(context) {
        const props = context.propsValue;
        const imageType = props.imageType || 'png';
        const clip = [props.clipX, props.clipY, props.clipWidth, props.clipHeight];
        const clipGiven = clip.filter((value) => value !== undefined && value !== null).length;
        if (clipGiven > 0 && clipGiven < 4) {
            throw new Error('To crop the screenshot, fill in all four of Crop X, Crop Y, Crop Width and Crop Height.');
        }
        const width = browserlessBody.optionalNumber({ value: props.width, label: 'Viewport Width', min: 1 });
        const height = browserlessBody.optionalNumber({ value: props.height, label: 'Viewport Height', min: 1 });
        if ((width === undefined) !== (height === undefined)) {
            throw new Error('Set both Viewport Width and Viewport Height, or leave both empty.');
        }
        const quality = browserlessBody.optionalNumber({ value: props.quality, label: 'Quality', min: 0, max: 100 });
        const delay = browserlessBody.optionalNumber({ value: props.delay, label: 'Extra Wait', min: 0 });

        const requestBody = {
            url: props.url,
            options: {
                type: imageType,
                fullPage: props.fullPage === true,
                ...(quality !== undefined && imageType !== 'png' ? { quality } : {}),
                ...(props.omitBackground === true ? { omitBackground: true } : {}),
                ...(clipGiven === 4
                    ? {
                          clip: {
                              x: Number(props.clipX),
                              y: Number(props.clipY),
                              width: Number(props.clipWidth),
                              height: Number(props.clipHeight),
                          },
                      }
                    : {}),
            },
            ...(width !== undefined && height !== undefined ? { viewport: { width, height } } : {}),
            ...(browserlessBody.nonEmpty(props.waitForSelector) ? { waitForSelector: { selector: props.waitForSelector.trim() } } : {}),
            ...(delay !== undefined ? { waitForTimeout: delay } : {}),
        };

        const response = await browserlessApi.request({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/screenshot',
            body: requestBody,
            responseType: 'arraybuffer',
            operation: 'Capture Screenshot',
        });

        const fileData = browserlessApi.toBuffer(response.body);
        const fileName = `screenshot.${imageType === 'jpeg' ? 'jpg' : imageType}`;
        const file = await context.files.write({ data: fileData, fileName });
        const site = browserlessApi.siteResponse(response.headers);

        return {
            success: true,
            file,
            screenshotBase64: fileData.toString('base64'),
            metadata: {
                url: props.url,
                type: imageType,
                fullPage: props.fullPage === true,
                timestamp: new Date().toISOString(),
                contentType: browserlessApi.headerValue({ headers: response.headers, name: 'content-type' }) ?? `image/${imageType}`,
                fileName,
                sizeBytes: fileData.length,
                siteStatusCode: site.site_status_code,
                finalUrl: site.final_url,
            },
        };
    },
});
