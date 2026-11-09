import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { BatchJobResponse, snaprenderBatch } from '../common/batch';
import { snaprenderApi } from '../common/client';
import { ALL_FORMATS, snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const batchScreenshots = createAction({
    auth: snaprenderAuth,
    name: 'batch_screenshots',
    classification: 'WRITE',
    displayName: 'Batch Screenshots',
    description: 'Capture up to 50 pages with the same settings in one job and get a download link for each.',
    audience: 'both',
    aiMetadata: {
        description:
            'Starts one SnapRender job that captures 1 to 50 public URLs with the same settings and returns a download link per page (links last 24 hours). Use it for lists of pages; for a single page use Take Screenshot, which returns the file directly. By default the step waits for the job to finish; otherwise check it later with Get Batch Status. Each call starts a new job and reserves one capture per URL (failed URLs are refunded).',
        idempotent: false,
    },
    props: {
        urls: Property.Array({
            displayName: 'Page URLs',
            description: 'The pages to capture, 1 to 50. Each must be reachable from the internet.',
            required: true,
        }),
        format: snaprenderProps.imageFormat({ includePdf: true, description: 'File type for every capture in the batch.' }),
        fullPage: snaprenderProps.fullPage({ defaultValue: false }),
        device: snaprenderProps.device(),
        darkMode: snaprenderProps.darkMode(),
        blockAds: snaprenderProps.blockAds(),
        blockCookieBanners: snaprenderProps.blockCookieBanners(),
        waitForResults: Property.Checkbox({
            displayName: 'Wait for Results',
            description: 'Keep the step running until every page is captured, so the next steps get the download links. Turn off to continue right away and use Get Batch Status later.',
            required: false,
            defaultValue: true,
        }),
        maxWaitSeconds: Property.Number({
            displayName: 'Maximum Wait (seconds)',
            description: 'With Wait for Results on: stop waiting after this many seconds, 10 to 300. Default 180. If the job is still running, the step returns its progress and the Job ID.',
            required: false,
            advanced: true,
        }),
        width: snaprenderProps.width(),
        height: snaprenderProps.height(),
        delay: snaprenderProps.delay(),
        quality: snaprenderProps.quality({ description: 'Image quality for JPEG, WebP and PDF, 1 to 100. Default 90. PNG ignores it.' }),
        hideSelectors: snaprenderProps.hideSelectors(),
        clickSelector: snaprenderProps.clickSelector(),
        userAgent: snaprenderProps.userAgent(),
    },
    outputSchema: snaprenderOutputSchemas.batch,
    async run(context) {
        const props = context.propsValue;
        const urls = normalizeUrls(props.urls);
        const format = snaprenderBody.format({ value: props.format ?? 'png', allowed: ALL_FORMATS });
        const maxWaitSeconds = snaprenderBody.optionalNumber({ value: props.maxWaitSeconds, label: 'Maximum Wait', min: 10, max: 300 }) ?? DEFAULT_MAX_WAIT_SECONDS;
        const apiKey = context.auth.secret_text;
        const response = await snaprenderApi.request<BatchJobResponse>({
            apiKey,
            method: HttpMethod.POST,
            path: '/v1/screenshot/batch',
            body: {
                urls,
                format,
                ...snaprenderBody.renderOptions({ ...props, quality: format === 'png' ? undefined : props.quality }),
            },
            timeoutMs: 60_000,
        });
        const created = response.body;
        if (props.waitForResults === false) {
            return snaprenderBatch.toOutput(created);
        }
        const finished = await snaprenderBatch.waitUntilFinished({ apiKey, job: created, maxWaitMs: maxWaitSeconds * 1000 });
        return snaprenderBatch.toOutput({ ...finished, estimatedSeconds: created.estimatedSeconds });
    },
});

function normalizeUrls(value: unknown): string[] {
    const list = Array.isArray(value) ? value : [];
    const urls = list
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item !== '')
        .map((item) => snaprenderBody.pageUrl({ value: item, label: 'Page URL' }));
    if (urls.length === 0) {
        throw new Error('Add at least one page URL.');
    }
    if (urls.length > MAX_URLS) {
        throw new Error(`A batch takes at most ${MAX_URLS} URLs; this one has ${urls.length}. Split the list into several batches.`);
    }
    return urls;
}

const MAX_URLS = 50;
const DEFAULT_MAX_WAIT_SECONDS = 180;
