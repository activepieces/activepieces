import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessCrawl } from '../common/crawl';
import { browserlessBody } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const getCrawl = createAction({
    auth: browserlessAuth,
    name: 'get_crawl',
    classification: 'READ',
    displayName: 'Get Crawl Results',
    description: 'Get the status of a crawl and one page of its scraped pages.',
    audience: 'both',
    aiMetadata: {
        description:
            'Returns the status and progress counters of a crawl started with Start Crawl, plus one batch of crawled pages (URL, title, HTTP status and a temporary link to the page content). Call again while status is in-progress; when has_more is true pass next_skip as Skip to read the next batch. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        crawlId: browserlessCrawl.crawlIdProp(),
        skip: Property.Number({
            displayName: 'Skip',
            description: 'Pages to skip; use Next Skip from the previous run.',
            required: false,
        }),
    },
    outputSchema: browserlessOutputSchemas.getCrawl,
    async run(context) {
        const crawlId = browserlessCrawl.parseCrawlId(context.propsValue.crawlId);
        const skip = browserlessBody.optionalNumber({ value: context.propsValue.skip, label: 'Skip', min: 0 });

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.GET,
            path: `/crawl/${encodeURIComponent(crawlId)}`,
            query: { skip: skip === undefined ? undefined : Math.floor(skip) },
            timeoutMs: 60_000,
            operation: 'Get Crawl Results',
        });

        const body = browserlessValues.record(response.body);
        const pages = Array.isArray(body['data']) ? body['data'].map(browserlessCrawl.toPage) : [];
        const next = browserlessValues.stringOrNull(body['next']);
        const nextSkip = readSkip(next);
        return {
            crawl_id: crawlId,
            status: browserlessValues.stringOrNull(body['status']),
            total: browserlessValues.numberOrNull(body['total']),
            completed: browserlessValues.numberOrNull(body['completed']),
            failed: browserlessValues.numberOrNull(body['failed']),
            expires_at: browserlessValues.stringOrNull(body['expiresAt']),
            skip: skip === undefined ? 0 : Math.floor(skip),
            page_count: pages.length,
            has_more: nextSkip !== null,
            next_skip: nextSkip,
            pages,
        };
    },
});

function readSkip(next: string | null): number | null {
    if (next === null || next === '') {
        return null;
    }
    const match = /[?&]skip=(\d+)/.exec(next);
    return match ? Number(match[1]) : null;
}
