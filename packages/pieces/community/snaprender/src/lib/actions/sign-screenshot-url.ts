import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderApi } from '../common/client';
import { ALL_FORMATS, snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const signScreenshotUrl = createAction({
    auth: snaprenderAuth,
    name: 'sign_screenshot_url',
    classification: 'READ',
    displayName: 'Create Screenshot Link',
    description: 'Create a signed link that shows a fresh screenshot of a page when opened. The link holds only a short prefix of your API key, never the full key.',
    audience: 'both',
    aiMetadata: {
        description:
            'Creates a signed, expiring SnapRender link that renders a screenshot of the page each time it is opened, for use in an img tag, an email or a chat message without exposing the API key. Use Take Screenshot instead when the flow needs the file itself. Creating the link is free; each opening uses one capture unless a recent stored copy is served.',
        idempotent: true,
    },
    props: {
        url: snaprenderProps.url({ description: 'Address of the page the link will capture.' }),
        expiresIn: Property.Number({
            displayName: 'Valid For (seconds)',
            description: 'How long the link works, 60 to 2592000 (30 days). Default 86400 (one day).',
            required: false,
        }),
        format: snaprenderProps.imageFormat({ includePdf: true, description: 'File type the link returns.' }),
        fullPage: snaprenderProps.fullPage({ defaultValue: false }),
        device: snaprenderProps.device(),
        darkMode: snaprenderProps.darkMode(),
        blockAds: snaprenderProps.blockAds(),
        blockCookieBanners: snaprenderProps.blockCookieBanners(),
        width: snaprenderProps.width(),
        height: snaprenderProps.height(),
        delay: snaprenderProps.delay(),
        quality: snaprenderProps.quality({ description: 'Image quality for JPEG, WebP and PDF, 1 to 100. Default 90. PNG ignores it.' }),
        hideSelectors: snaprenderProps.hideSelectors(),
        clickSelector: snaprenderProps.clickSelector(),
        userAgent: snaprenderProps.userAgent(),
    },
    outputSchema: snaprenderOutputSchemas.signedUrl,
    async run(context) {
        const props = context.propsValue;
        const format = snaprenderBody.format({ value: props.format ?? 'png', allowed: ALL_FORMATS });
        const expiresIn = snaprenderBody.optionalNumber({ value: props.expiresIn, label: 'Valid For', min: 60, max: 2592000 });
        const response = await snaprenderApi.request<SignResponse>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.POST,
            path: '/v1/screenshot/sign',
            body: {
                url: snaprenderBody.pageUrl({ value: props.url, label: 'Page URL' }),
                format,
                ...(expiresIn !== undefined ? { expires_in: expiresIn } : {}),
                ...snaprenderBody.renderOptions({ ...props, quality: format === 'png' ? undefined : props.quality }),
            },
            timeoutMs: 30_000,
        });
        return {
            signed_url: response.body.signed_url,
            expires_at: response.body.expires_at ?? null,
            expires_in_seconds: response.body.expires_in ?? null,
        };
    },
});


type SignResponse = {
    signed_url: string;
    expires_at?: string;
    expires_in?: number;
};
