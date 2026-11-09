import { createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderCapture } from '../common/capture';
import { IMAGE_FORMATS, snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const takeScreenshot = createAction({
    auth: snaprenderAuth,
    name: 'take_screenshot',
    classification: 'READ',
    displayName: 'Take Screenshot',
    description: 'Capture a web page as a PNG, JPEG or WebP image.',
    audience: 'both',
    aiMetadata: {
        description:
            'Opens a public web page in a real browser and saves a PNG, JPEG or WebP screenshot as a file. Use it to see how a page looks, on desktop or as a phone with Device; to read the page text use Extract Content, for a PDF use Create PDF. Ads and cookie banners are removed by default. Each call renders the page again and uses one capture from the monthly quota.',
        idempotent: false,
    },
    props: {
        url: snaprenderProps.url({ description: 'Address of the page to capture. It must be reachable from the internet.' }),
        format: snaprenderProps.imageFormat({ includePdf: false, description: 'File type of the screenshot. PNG keeps text sharp; JPEG and WebP give smaller files.' }),
        fullPage: snaprenderProps.fullPage({ defaultValue: false }),
        device: snaprenderProps.device(),
        darkMode: snaprenderProps.darkMode(),
        blockAds: snaprenderProps.blockAds(),
        blockCookieBanners: snaprenderProps.blockCookieBanners(),
        width: snaprenderProps.width(),
        height: snaprenderProps.height(),
        delay: snaprenderProps.delay(),
        quality: snaprenderProps.quality({ description: 'Image quality for JPEG and WebP, 1 to 100. Default 90. PNG ignores it.' }),
        hideSelectors: snaprenderProps.hideSelectors(),
        clickSelector: snaprenderProps.clickSelector(),
        userAgent: snaprenderProps.userAgent(),
        useCache: snaprenderProps.useCache(),
        cacheTtl: snaprenderProps.cacheTtl(),
        embedDetails: snaprenderProps.embedDetails(),
        fileName: snaprenderProps.fileName({ placeholder: 'homepage' }),
    },
    outputSchema: snaprenderOutputSchemas.capture,
    async run(context) {
        const props = context.propsValue;
        const format = snaprenderBody.format({ value: props.format ?? 'png', allowed: IMAGE_FORMATS });
        return snaprenderCapture.run({
            apiKey: context.auth.secret_text,
            files: context.files,
            source: { type: 'url', value: snaprenderBody.pageUrl({ value: props.url, label: 'Page URL' }) },
            format,
            options: {
                ...snaprenderBody.renderOptions({ ...props, quality: format === 'png' ? undefined : props.quality }),
                ...snaprenderBody.cacheOptions(props),
            },
            embedDetails: props.embedDetails,
            requestedFileName: props.fileName,
        });
    },
});

