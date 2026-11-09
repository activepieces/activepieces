import { createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderCapture } from '../common/capture';
import { snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const createPdf = createAction({
    auth: snaprenderAuth,
    name: 'create_pdf',
    classification: 'READ',
    displayName: 'Create PDF',
    description: 'Save a web page as a single-page PDF that shows the page as it looks in the browser.',
    audience: 'both',
    aiMetadata: {
        description:
            'Opens a public web page in a real browser and saves it as a PDF file containing an image of the rendered page (the full page by default). Use it to archive or attach a page as it looked; the PDF text is not selectable, so use Extract Content when you need the words. Each call renders the page again and uses one capture from the monthly quota.',
        idempotent: false,
    },
    props: {
        url: snaprenderProps.url({ description: 'Address of the page to save. It must be reachable from the internet.' }),
        fullPage: snaprenderProps.fullPage({ defaultValue: true }),
        device: snaprenderProps.device(),
        darkMode: snaprenderProps.darkMode(),
        blockAds: snaprenderProps.blockAds(),
        blockCookieBanners: snaprenderProps.blockCookieBanners(),
        width: snaprenderProps.width(),
        height: snaprenderProps.height(),
        delay: snaprenderProps.delay(),
        quality: snaprenderProps.quality({ description: 'Quality of the page image inside the PDF, 1 to 100. Default 90. Lower values give smaller files.' }),
        hideSelectors: snaprenderProps.hideSelectors(),
        clickSelector: snaprenderProps.clickSelector(),
        userAgent: snaprenderProps.userAgent(),
        useCache: snaprenderProps.useCache(),
        cacheTtl: snaprenderProps.cacheTtl(),
        embedDetails: snaprenderProps.embedDetails(),
        fileName: snaprenderProps.fileName({ placeholder: 'invoice-2026-11' }),
    },
    outputSchema: snaprenderOutputSchemas.capture,
    async run(context) {
        const props = context.propsValue;
        return snaprenderCapture.run({
            apiKey: context.auth.secret_text,
            files: context.files,
            source: { type: 'url', value: snaprenderBody.pageUrl({ value: props.url, label: 'Page URL' }) },
            format: 'pdf',
            options: {
                ...snaprenderBody.renderOptions(props),
                ...snaprenderBody.cacheOptions(props),
            },
            embedDetails: props.embedDetails,
            requestedFileName: props.fileName,
        });
    },
});
