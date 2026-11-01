import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const searchWeb = createAction({
    auth: browserlessAuth,
    name: 'search_web',
    classification: 'SEARCH',
    displayName: 'Search the Web',
    description: 'Search the web (pages, news or images) and optionally read each result page as markdown.',
    audience: 'both',
    aiMetadata: {
        description:
            'Runs a web search and returns ranked results (title, URL, snippet) from web, news and/or image sources, optionally scraping each result page into markdown (each page cut to Maximum Characters, default 100000). Use to find pages about a topic before reading them; to read one known URL use Smart Scrape. The result count per source is capped by the Browserless plan (Free 3, Starter 10, Scale 20). Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: 'What to search for, for example `best headless browser 2026`.',
            required: true,
        }),
        sources: Property.StaticMultiSelectDropdown({
            displayName: 'Sources',
            description: 'Where to search. Web is used when empty.',
            required: false,
            defaultValue: ['web'],
            options: {
                options: [
                    { label: 'Web', value: 'web' },
                    { label: 'News', value: 'news' },
                    { label: 'Images', value: 'images' },
                ],
            },
        }),
        limit: Property.Number({
            displayName: 'Results per Source',
            description: 'Results per source (default 10, capped by your plan).',
            required: false,
        }),
        tbs: Property.StaticDropdown({
            displayName: 'Time Range',
            description: 'Only return results from this period.',
            required: false,
            options: {
                options: [
                    { label: 'Past Day', value: 'day' },
                    { label: 'Past Week', value: 'week' },
                    { label: 'Past Month', value: 'month' },
                    { label: 'Past Year', value: 'year' },
                ],
            },
        }),
        categories: Property.StaticMultiSelectDropdown({
            displayName: 'Categories',
            description: 'Narrow results to GitHub repositories, research papers or PDF documents.',
            required: false,
            options: {
                options: [
                    { label: 'GitHub', value: 'github' },
                    { label: 'Research', value: 'research' },
                    { label: 'PDF', value: 'pdf' },
                ],
            },
        }),
        lang: Property.ShortText({
            displayName: 'Language',
            description: 'Two-letter language code for results, for example `en` or `de` (default `en`).',
            required: false,
        }),
        country: Property.ShortText({
            displayName: 'Country',
            description: 'Two-letter country code for local results, for example `us` or `gb`.',
            required: false,
        }),
        location: Property.ShortText({
            displayName: 'Location',
            description: 'City or region to narrow results, used with Country.',
            required: false,
        }),
        scrapeFormats: Property.StaticMultiSelectDropdown({
            displayName: 'Read Result Pages As',
            description: 'Also read each result page in these formats (slower, costs more).',
            required: false,
            options: {
                options: [
                    { label: 'Markdown', value: 'markdown' },
                    { label: 'HTML', value: 'html' },
                    { label: 'Links', value: 'links' },
                ],
            },
        }),
        onlyMainContent: Property.Checkbox({
            displayName: 'Only Main Content',
            description: 'When reading result pages, drop navigation, headers and footers.',
            required: false,
            defaultValue: false,
        }),
        proxy: browserlessProps.proxy({
            description: 'Proxy network used to read result pages. Browserless uses Residential when empty; Datacenter is cheaper.',
        }),
        maxCharacters: browserlessProps.maxCharacters(),
        timeout: browserlessProps.sessionTimeout(),
    },
    outputSchema: browserlessOutputSchemas.searchWeb,
    async run(context) {
        const props = context.propsValue;
        const query = (props.query ?? '').trim();
        if (query === '') {
            throw new Error('Enter a search query.');
        }
        const limit = browserlessBody.optionalNumber({ value: props.limit, label: 'Results per Source', min: 1, max: 100 });
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });
        const sources = browserlessBody.textList(props.sources);
        const categories = browserlessBody.textList(props.categories);
        const scrapeFormats = browserlessBody.textList(props.scrapeFormats);
        const maxCharacters = browserlessBody.maxCharacters(props.maxCharacters);

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/search',
            body: {
                query,
                ...(limit !== undefined ? { limit: Math.floor(limit) } : {}),
                ...(sources.length > 0 ? { sources } : {}),
                ...(categories.length > 0 ? { categories } : {}),
                ...(browserlessBody.nonEmpty(props.tbs) ? { tbs: props.tbs } : {}),
                ...(browserlessBody.nonEmpty(props.lang) ? { lang: props.lang.trim().toLowerCase() } : {}),
                ...(browserlessBody.nonEmpty(props.country) ? { country: props.country.trim().toLowerCase() } : {}),
                ...(browserlessBody.nonEmpty(props.location) ? { location: props.location.trim() } : {}),
                ...(browserlessBody.nonEmpty(props.proxy) ? { proxy: props.proxy } : {}),
                ...(scrapeFormats.length > 0
                    ? { scrapeOptions: { formats: scrapeFormats, ...(props.onlyMainContent === true ? { onlyMainContent: true } : {}) } }
                    : {}),
                ...(timeout !== undefined ? { timeout } : {}),
            },
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Search the Web',
        });

        const body = browserlessValues.record(response.body);
        const errorCode = browserlessValues.stringOrNull(body['errorCode']);
        if (body['success'] !== true && errorCode !== 'no_results') {
            throw new BrowserlessApiError({
                message: `Search the Web failed: ${browserlessValues.stringOrNull(body['error']) ?? errorCode ?? 'Browserless returned no results'}`,
                status: response.status,
                responseBody: { success: body['success'], error: body['error'], errorCode },
            });
        }
        const data = browserlessValues.record(body['data']);
        const results = SOURCES.flatMap((source) =>
            (Array.isArray(data[source]) ? data[source] : []).map((item: unknown) => toResult({ source, item: browserlessValues.record(item), maxCharacters })),
        );

        return {
            query,
            total_results: browserlessValues.numberOrNull(body['totalResults']) ?? results.length,
            result_count: results.length,
            no_results: errorCode === 'no_results' || results.length === 0,
            results,
        };
    },
});

function toResult({ source, item, maxCharacters }: { source: string; item: Record<string, unknown>; maxCharacters: number }) {
    const metadata = browserlessValues.record(item['metadata']);
    const markdown = browserlessBody.cap({ text: browserlessValues.stringOrNull(item['markdown']), max: maxCharacters });
    const html = browserlessBody.cap({ text: browserlessValues.stringOrNull(item['html']), max: maxCharacters });
    return {
        source,
        position: browserlessValues.numberOrNull(item['position']),
        title: browserlessValues.stringOrNull(item['title']),
        url: browserlessValues.stringOrNull(item['url']),
        description: browserlessValues.stringOrNull(item['description']),
        date: browserlessValues.stringOrNull(item['date']),
        image_url: browserlessValues.stringOrNull(item['imageUrl']),
        markdown: markdown.text,
        html: html.text,
        truncated: markdown.truncated || html.truncated,
        links: Array.isArray(item['links']) ? browserlessValues.stringList(item['links']) : null,
        page_status_code: browserlessValues.numberOrNull(metadata['statusCode']),
        page_error: browserlessValues.stringOrNull(metadata['error']),
    };
}

const SOURCES = ['web', 'news', 'images'];
