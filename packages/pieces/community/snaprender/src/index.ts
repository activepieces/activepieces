import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { batchScreenshots } from './lib/actions/batch-screenshots';
import { checkCache } from './lib/actions/check-cache';
import { createPdf } from './lib/actions/create-pdf';
import { extractContent } from './lib/actions/extract-content';
import { getBatchStatus } from './lib/actions/get-batch-status';
import { getUsage } from './lib/actions/get-usage';
import { renderHtml } from './lib/actions/render-html';
import { signScreenshotUrl } from './lib/actions/sign-screenshot-url';
import { takeScreenshot } from './lib/actions/take-screenshot';
import { snaprenderAuth } from './lib/auth';
import { SNAPRENDER_BASE_URL } from './lib/common/client';

export const snaprender = createPiece({
    displayName: 'SnapRender',
    description: 'Screenshot API: capture web pages as PNG, JPEG, WebP or PDF, render your own HTML, and extract page content as Markdown.',
    minimumSupportedRelease: '0.88.2',
    logoUrl: 'https://snap-render.com/brand/snaprender-icon-512.png',
    categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.CONTENT_AND_FILES],
    authors: ['User0856'],
    auth: snaprenderAuth,
    actions: [
        takeScreenshot,
        createPdf,
        renderHtml,
        extractContent,
        batchScreenshots,
        getBatchStatus,
        signScreenshotUrl,
        checkCache,
        getUsage,
        createCustomApiCallAction({
            auth: snaprenderAuth,
            baseUrl: () => SNAPRENDER_BASE_URL,
            authMapping: async (auth, propsValue) => {
                const url = readUrlProp(propsValue);
                if (/^https?:\/\//i.test(url) && !isSnapRenderUrl(url)) {
                    throw new Error(`Custom API Call only sends your SnapRender API key to ${SNAPRENDER_BASE_URL}. Use a path such as /v1/usage instead of another address.`);
                }
                return { 'X-API-Key': auth.secret_text.trim() };
            },
        }),
    ],
    triggers: [],
});

function readUrlProp(propsValue: Record<string, unknown>): string {
    const holder = propsValue['url'];
    if (typeof holder === 'object' && holder !== null && 'url' in holder && typeof holder.url === 'string') {
        return holder.url.trim();
    }
    return '';
}

function isSnapRenderUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.origin === SNAPRENDER_BASE_URL && parsed.username === '' && parsed.password === '';
    } catch {
        return false;
    }
}
