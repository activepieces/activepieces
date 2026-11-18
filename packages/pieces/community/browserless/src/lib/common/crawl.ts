import { Property } from '@activepieces/pieces-framework';
import { browserlessValues } from './values';

export const browserlessCrawl = {
    crawlIdProp,
    parseCrawlId,
    toPage,
    toSummary,
};

function crawlIdProp() {
    return Property.ShortText({
        displayName: 'Crawl ID',
        description: 'The ID returned by Start Crawl (looks like `crawl_abc123`). List Crawls shows recent IDs.',
        required: true,
    });
}

function parseCrawlId(value: unknown): string {
    const id = typeof value === 'string' ? value.trim() : '';
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(id)) {
        throw new Error('Crawl ID must look like `crawl_abc123` (letters, digits, - and _ only).');
    }
    return id;
}

function toPage(entry: unknown) {
    const item = browserlessValues.record(entry);
    const metadata = browserlessValues.record(item['metadata']);
    return {
        status: browserlessValues.stringOrNull(item['status']),
        url: browserlessValues.stringOrNull(metadata['sourceURL']),
        title: browserlessValues.stringOrNull(metadata['title']),
        description: browserlessValues.stringOrNull(metadata['description']),
        language: browserlessValues.stringOrNull(metadata['language']),
        status_code: browserlessValues.numberOrNull(metadata['statusCode']),
        scraped_at: browserlessValues.stringOrNull(metadata['scrapedAt']),
        error: browserlessValues.stringOrNull(metadata['error']),
        content_url: browserlessValues.stringOrNull(item['contentUrl']),
    };
}

function toSummary(entry: unknown) {
    const item = browserlessValues.record(entry);
    return {
        id: browserlessValues.stringOrNull(item['id']),
        url: browserlessValues.stringOrNull(item['url']),
        status: browserlessValues.stringOrNull(item['status']),
        total: browserlessValues.numberOrNull(item['total']),
        completed: browserlessValues.numberOrNull(item['completed']),
        created_at: browserlessValues.stringOrNull(item['createdAt']),
        completed_at: browserlessValues.stringOrNull(item['completedAt']),
    };
}
