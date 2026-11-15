import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessCrawl } from '../common/crawl';
import { browserlessBody } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const listCrawls = createAction({
    auth: browserlessAuth,
    name: 'list_crawls',
    classification: 'SEARCH',
    displayName: 'List Crawls',
    description: 'List your recent crawls with their status and progress.',
    audience: 'both',
    aiMetadata: {
        description:
            'Lists crawl jobs on this Browserless account, newest first, with ID, start URL, status and page counts; filter by status and page with the cursor. Use to find a crawl ID when you no longer have it; use Get Crawl Results for the pages of one crawl. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Only list crawls with this status.',
            required: false,
            options: {
                options: [
                    { label: 'In Progress', value: 'in-progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Failed', value: 'failed' },
                    { label: 'Cancelled', value: 'cancelled' },
                ],
            },
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'How many crawls to return in this batch.',
            required: false,
        }),
        cursor: Property.ShortText({
            displayName: 'Cursor',
            description: 'Next Cursor from a previous run, to read the next batch.',
            required: false,
        }),
    },
    outputSchema: browserlessOutputSchemas.listCrawls,
    async run(context) {
        const props = context.propsValue;
        const limit = browserlessBody.optionalNumber({ value: props.limit, label: 'Limit', min: 1, max: 1000 });
        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.GET,
            path: '/crawl',
            query: {
                status: browserlessBody.nonEmpty(props.status) ? props.status : undefined,
                limit: limit === undefined ? undefined : Math.floor(limit),
                cursor: browserlessBody.nonEmpty(props.cursor) ? props.cursor.trim() : undefined,
            },
            timeoutMs: 60_000,
            operation: 'List Crawls',
        });

        const body = browserlessValues.record(response.body);
        const crawls = Array.isArray(body['crawls']) ? body['crawls'].map(browserlessCrawl.toSummary) : [];
        const nextCursor = browserlessValues.stringOrNull(body['nextCursor']);
        return {
            count: crawls.length,
            has_more: nextCursor !== null && nextCursor !== '',
            next_cursor: nextCursor === '' ? null : nextCursor,
            crawls,
        };
    },
});
