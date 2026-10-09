import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessOutputSchemas } from '../output-schemas';

export const captureScreenshot = createAction({
    name: 'capture_screenshot',
    classification: 'READ',
    displayName: 'Capture Screenshot',
    description: 'Take a screenshot of a web page',
    audience: 'human',
    aiMetadata: { description: 'Renders a web page in a headless browser and returns a PNG, JPEG or WebP screenshot as a file. Use to capture the visual state of a public URL; for page text use Get Page Content or Smart Scrape instead. The page URL is required, and options like full-page capture, viewport size, clipping region, and waiting for a CSS selector control what is rendered. Each call renders the live page again and stores a new file (about 1 Browserless unit per 30 s).', idempotent: false },
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The URL of the page to capture',
            required: true,
        }),
        imageType: Property.StaticDropdown({
            displayName: 'Image Type',
            description: 'Format of the screenshot image',
            required: false,
            defaultValue: 'png',
            options: {
                options: [
                    { label: 'PNG', value: 'png' },
                    { label: 'JPEG', value: 'jpeg' },
                    { label: 'WebP', value: 'webp' },
                ]
            }
        }),
        quality: Property.Number({
            displayName: 'Quality',
            description: 'Image quality (0-100, only for JPEG and WebP)',
            required: false,
        }),
        fullPage: Property.Checkbox({
            displayName: 'Full Page',
            description: 'Capture the full scrollable page',
            required: false,
            defaultValue: false,
        }),
        width: Property.Number({
            displayName: 'Viewport Width',
            description: 'Width of the browser viewport in pixels',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Viewport Height',
            description: 'Height of the browser viewport in pixels',
            required: false,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before taking screenshot',
            required: false,
        }),
        delay: Property.Number({
            displayName: 'Delay (ms)',
            description: 'Delay in milliseconds before taking screenshot',
            required: false,
        }),
        omitBackground: Property.Checkbox({
            displayName: 'Omit Background',
            description: 'Hide default white background for transparent screenshots',
            required: false,
            defaultValue: false,
        }),
        clipX: Property.Number({
            displayName: 'Clip X Position',
            description: 'X coordinate of the top-left corner for clipping',
            required: false,
        }),
        clipY: Property.Number({
            displayName: 'Clip Y Position',
            description: 'Y coordinate of the top-left corner for clipping',
            required: false,
        }),
        clipWidth: Property.Number({
            displayName: 'Clip Width',
            description: 'Width of the clipping area',
            required: false,
        }),
        clipHeight: Property.Number({
            displayName: 'Clip Height',
            description: 'Height of the clipping area',
            required: false,
        }),
    },
    outputSchema: browserlessOutputSchemas.captureScreenshot,
    async run(context) {
        const props = context.propsValue;
        const imageType = props.imageType || 'png';
        const clip = [props.clipX, props.clipY, props.clipWidth, props.clipHeight];
        const clipGiven = clip.filter((value) => value !== undefined && value !== null).length;
        if (clipGiven > 0 && clipGiven < 4) {
            throw new Error('To clip the screenshot, fill in all four of Clip X, Clip Y, Clip Width and Clip Height.');
        }
        const width = browserlessBody.optionalNumber({ value: props.width, label: 'Viewport Width', min: 1 });
        const height = browserlessBody.optionalNumber({ value: props.height, label: 'Viewport Height', min: 1 });
        if ((width === undefined) !== (height === undefined)) {
            throw new Error('Set both Viewport Width and Viewport Height, or leave both empty.');
        }
        const quality = browserlessBody.optionalNumber({ value: props.quality, label: 'Quality', min: 0, max: 100 });
        const delay = browserlessBody.optionalNumber({ value: props.delay, label: 'Delay', min: 0 });

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
