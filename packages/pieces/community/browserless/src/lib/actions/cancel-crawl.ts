import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessCrawl } from '../common/crawl';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const cancelCrawl = createAction({
    auth: browserlessAuth,
    name: 'cancel_crawl',
    classification: 'DESTRUCTIVE',
    displayName: 'Cancel Crawl',
    description: 'Stop a running crawl. Pages already scraped stay available.',
    audience: 'both',
    aiMetadata: {
        description:
            'Stops a running crawl by its ID so no more pages are scraped (and billed); pages already finished stay readable with Get Crawl Results. A cancelled crawl cannot be resumed. If the crawl already finished, it reports cancelled=false with the final status instead of failing, so a retry is safe.',
        idempotent: true,
    },
    props: {
        crawlId: browserlessCrawl.crawlIdProp(),
    },
    outputSchema: browserlessOutputSchemas.cancelCrawl,
    async run(context) {
        const crawlId = browserlessCrawl.parseCrawlId(context.propsValue.crawlId);
        try {
            const response = await browserlessApi.request<unknown>({
                auth: context.auth.props,
                method: HttpMethod.DELETE,
                path: `/crawl/${encodeURIComponent(crawlId)}`,
                timeoutMs: 60_000,
                operation: 'Cancel Crawl',
            });
            const body = browserlessValues.record(response.body);
            return {
                crawl_id: crawlId,
                cancelled: true,
                status: browserlessValues.stringOrNull(body['status']) ?? 'cancelled',
                message: null,
            };
        } catch (error) {
            if (error instanceof BrowserlessApiError && error.status === 409) {
                const body = browserlessValues.record(error.responseBody);
                return {
                    crawl_id: crawlId,
                    cancelled: false,
                    status: browserlessValues.stringOrNull(body['status']),
                    message: browserlessValues.stringOrNull(body['message']) ?? 'The crawl had already finished.',
                };
            }
            throw error;
        }
    },
});
