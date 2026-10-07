import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const startCrawl = createAction({
    auth: browserlessAuth,
    name: 'start_crawl',
    classification: 'SEARCH',
    displayName: 'Start Crawl',
    description: 'Start crawling a website in the background. Browserless follows links and scrapes every page it finds; use Get Crawl Results to read them.',
    audience: 'both',
    aiMetadata: {
        description:
            'Starts an asynchronous crawl that follows links from a start URL and scrapes each page (markdown by default), returning a crawl ID right away. Use for many pages of one site; for a single page use Smart Scrape, for just the URL list use Map Website URLs. Poll Get Crawl Results with the ID until status is completed. Each call starts a new billed crawl, so do not retry blindly.',
        idempotent: false,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'Where the crawl starts, for example https://example.com/docs' }),
        limit: Property.Number({
            displayName: 'Maximum Pages',
            description: 'Stop after this many pages (capped by your plan); each page costs units.',
            required: false,
            defaultValue: 10,
        }),
        maxDepth: Property.Number({
            displayName: 'Maximum Link Depth',
            description: 'How many links away from the start URL to follow (0-20, default 5).',
            required: false,
        }),
        includePaths: Property.Array({
            displayName: 'Only Paths Matching',
            description: 'Regexes; only matching paths are crawled, e.g. `^/docs/`.',
            required: false,
        }),
        excludePaths: Property.Array({
            displayName: 'Skip Paths Matching',
            description: 'Regular expressions for paths to skip, for example `^/blog/`.',
            required: false,
        }),
        allowSubdomains: Property.Checkbox({
            displayName: 'Follow Subdomains',
            description: 'Also crawl subdomains such as blog.example.com.',
            required: false,
            defaultValue: false,
        }),
        allowExternalLinks: Property.Checkbox({
            displayName: 'Follow External Links',
            description: 'Also follow links to other websites.',
            required: false,
            defaultValue: false,
        }),
        sitemap: Property.StaticDropdown({
            displayName: 'Sitemap',
            description: 'How to use the sitemap to find pages.',
            required: false,
            options: {
                options: [
                    { label: 'Auto (default)', value: 'auto' },
                    { label: 'Only the sitemap', value: 'force' },
                    { label: 'Ignore the sitemap', value: 'skip' },
                ],
            },
        }),
        formats: Property.StaticMultiSelectDropdown({
            displayName: 'Page Formats',
            description: 'What to store for each page (default markdown).',
            required: false,
            options: {
                options: [
                    { label: 'Markdown', value: 'markdown' },
                    { label: 'HTML', value: 'html' },
                    { label: 'Plain Text', value: 'rawText' },
                ],
            },
        }),
        onlyMainContent: Property.Checkbox({
            displayName: 'Only Main Content',
            description: 'Drop navigation, headers and footers from each page (Browserless default is on).',
            required: false,
            defaultValue: true,
        }),
        proxy: browserlessProps.proxy({
            description: 'Proxy network for fetching pages. Browserless uses Residential when empty; Datacenter is cheaper.',
        }),
    },
    outputSchema: browserlessOutputSchemas.startCrawl,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const limit = browserlessBody.optionalNumber({ value: props.limit, label: 'Maximum Pages', min: 1 });
        const maxDepth = browserlessBody.optionalNumber({ value: props.maxDepth, label: 'Maximum Link Depth', min: 0, max: 20 });
        const includePaths = browserlessBody.textList(props.includePaths);
        const excludePaths = browserlessBody.textList(props.excludePaths);
        const formats = browserlessBody.textList(props.formats);
        const scrapeOptions = {
            ...(formats.length > 0 ? { formats } : {}),
            ...(typeof props.onlyMainContent === 'boolean' ? { onlyMainContent: props.onlyMainContent } : {}),
            ...(browserlessBody.nonEmpty(props.proxy) ? { proxy: props.proxy } : {}),
        };

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/crawl',
            body: {
                url,
                ...(limit !== undefined ? { limit: Math.floor(limit) } : {}),
                ...(maxDepth !== undefined ? { maxDepth: Math.floor(maxDepth) } : {}),
                ...(includePaths.length > 0 ? { includePaths } : {}),
                ...(excludePaths.length > 0 ? { excludePaths } : {}),
                ...(props.allowSubdomains === true ? { allowSubdomains: true } : {}),
                ...(props.allowExternalLinks === true ? { allowExternalLinks: true } : {}),
                ...(browserlessBody.nonEmpty(props.sitemap) ? { sitemap: props.sitemap } : {}),
                ...(Object.keys(scrapeOptions).length > 0 ? { scrapeOptions } : {}),
            },
            timeoutMs: 60_000,
            operation: 'Start Crawl',
        });

        const body = browserlessValues.record(response.body);
        const crawlId = browserlessValues.stringOrNull(body['id']);
        if (crawlId === null) {
            throw new BrowserlessApiError({
                message: `Start Crawl failed: ${browserlessValues.stringOrNull(body['message']) ?? browserlessValues.stringOrNull(body['error']) ?? 'Browserless returned no crawl ID'}`,
                status: response.status,
                responseBody: body,
            });
        }
        return {
            crawl_id: crawlId,
            url,
            status: 'in-progress',
        };
    },
});
