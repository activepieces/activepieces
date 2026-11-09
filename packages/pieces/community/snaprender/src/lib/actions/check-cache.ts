import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderApi } from '../common/client';
import { ALL_FORMATS, snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const checkCache = createAction({
    auth: snaprenderAuth,
    name: 'check_cache',
    classification: 'READ',
    displayName: 'Check Stored Copy',
    description: 'Check whether a recent copy of a screenshot is stored, without taking a new one. Use the same settings as the capture.',
    audience: 'both',
    aiMetadata: {
        description:
            'Tells whether SnapRender holds a stored copy of a capture made with exactly these settings, and when it expires. Use it before Take Screenshot or Create PDF with Reuse Recent Capture on, to know whether the capture will be free. Copies exist only for captures made with that option or through screenshot links. Free, renders nothing and is safe to repeat.',
        idempotent: true,
    },
    props: {
        url: snaprenderProps.url({ description: 'Address of the page, exactly as it was captured.' }),
        format: snaprenderProps.imageFormat({ includePdf: true, description: 'File type of the stored copy to look for.' }),
        fullPage: snaprenderProps.fullPage({ defaultValue: false }),
        device: snaprenderProps.device(),
        darkMode: snaprenderProps.darkMode(),
        blockAds: snaprenderProps.blockAds(),
        blockCookieBanners: snaprenderProps.blockCookieBanners(),
        width: snaprenderProps.width(),
        height: snaprenderProps.height(),
        quality: snaprenderProps.quality({ description: 'Quality used for the capture, 1 to 100. Default 90.' }),
        hideSelectors: snaprenderProps.hideSelectors(),
        clickSelector: snaprenderProps.clickSelector(),
        userAgent: snaprenderProps.userAgent(),
    },
    outputSchema: snaprenderOutputSchemas.cache,
    async run(context) {
        const props = context.propsValue;
        const format = snaprenderBody.format({ value: props.format ?? 'png', allowed: ALL_FORMATS });
        const response = await snaprenderApi.request<CacheInfoResponse>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.GET,
            path: '/v1/screenshot/info',
            query: {
                url: snaprenderBody.pageUrl({ value: props.url, label: 'Page URL' }),
                format,
                ...snaprenderBody.renderOptions({ ...props, quality: format === 'png' ? undefined : props.quality }),
            },
            timeoutMs: 30_000,
        });
        const body = response.body;
        return {
            url: body.url ?? null,
            cached: body.cached === true,
            cached_at: body.cached_at ?? body.cachedAt ?? null,
            expires_at: body.expires_at ?? body.expiresAt ?? null,
            content_type: body.content_type ?? null,
        };
    },
});

type CacheInfoResponse = {
    url?: string;
    cached?: boolean;
    cached_at?: string;
    expires_at?: string;
    content_type?: string;
    cachedAt?: string;
    expiresAt?: string;
};
