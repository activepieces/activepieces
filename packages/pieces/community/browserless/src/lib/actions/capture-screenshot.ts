import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessCommon, convertBinaryToBase64, isBinaryResponse } from '../common/client';

export const captureScreenshot = createAction({
    name: 'capture_screenshot',
    displayName: 'Capture Screenshot',
    description: 'Take a screenshot of a web page',
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
                    { label: 'JPEG', value: 'jpeg' }
                ]
            }
        }),
        quality: Property.Number({
            displayName: 'Quality',
            description: 'Image quality (0-100, only for JPEG)',
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
    async run(context) {
        const requestBody: any = {
            url: context.propsValue.url,
            options: {
                type: context.propsValue.imageType || 'png',
                fullPage: context.propsValue.fullPage || false,
            }
        };

        if (context.propsValue.quality && context.propsValue.imageType === 'jpeg') {
            requestBody.options.quality = context.propsValue.quality;
        }

        if (context.propsValue.width && context.propsValue.height) {
            requestBody.viewport = {
                width: context.propsValue.width,
                height: context.propsValue.height,
            };
        }

        if (context.propsValue.waitForSelector) {
            requestBody.waitForSelector = {
                selector: context.propsValue.waitForSelector,
            };
        }

        if (context.propsValue.delay) {
            requestBody.waitForTimeout = context.propsValue.delay;
        }

        if (context.propsValue.omitBackground) {
            requestBody.options.omitBackground = context.propsValue.omitBackground;
        }

        if (context.propsValue.clipX !== undefined && 
            context.propsValue.clipY !== undefined && 
            context.propsValue.clipWidth !== undefined && 
            context.propsValue.clipHeight !== undefined) {
            requestBody.options.clip = {
                x: context.propsValue.clipX,
                y: context.propsValue.clipY,
                width: context.propsValue.clipWidth,
                height: context.propsValue.clipHeight,
            };
        }

        const response = await browserlessCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/screenshot',
            body: requestBody,
        });

        const imageType = context.propsValue.imageType || 'png';
        const fileName = `screenshot.${imageType}`;
        
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
            screenshotBase64: convertBinaryToBase64(fileData),
            metadata: {
                url: context.propsValue.url,
                type: imageType,
                fullPage: context.propsValue.fullPage || false,
                timestamp: new Date().toISOString(),
                contentType: response.headers?.['content-type'] || `image/${imageType}`,
                fileName: fileName,
            }
        };
    },
});
