import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

const DEFAULT_LIMIT = 10;

export const startCrawl = createAction({
    auth: browserlessAuth,
    name: 'start_crawl',
    classification: 'SEARCH',
    displayName: 'Start Crawl',
    description: 'Crawl a website in the background; read the pages with Get Crawl Results.',
    propertyGroups: [
        { key: 'start', display: 'section', label: 'Start', icon: 'send', props: ['url', 'limit', 'maxDepth'] },
        { key: 'scope', display: 'section', label: 'Scope', icon: 'filter', props: ['includePaths', 'excludePaths', 'allowSubdomains', 'allowExternalLinks', 'sitemap'] },
        { key: 'output', display: 'section', label: 'Output', icon: 'file', props: ['formats', 'onlyMainContent'] },
    ],
    audience: 'both',
    aiMetadata: {
        description:
            'Starts an asynchronous crawl that follows links from a start URL and scrapes each page (markdown by default), returning a crawl ID right away. Use for many pages of one site; for a single page use Smart Scrape, for just the URL list use Map Website URLs. Poll Get Crawl Results with the ID until status is completed. Each call starts a new billed crawl, so do not retry blindly.',
        idempotent: false,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'Where the crawl starts.' }),
        limit: Property.Number({
            displayName: 'Maximum Pages',
            description: 'Stop after this many pages; each page costs units.',
            required: false,
            defaultValue: DEFAULT_LIMIT,
        }),
        maxDepth: Property.Number({
            displayName: 'Maximum Link Depth',
            description: 'How many links away from the start to follow, 0 to 20. Empty: 5.',
            required: false,
        }),
        includePaths: Property.Array({
            displayName: 'Only Paths Matching',
            description: 'Regular expressions; only matching paths are crawled.',
            required: false,
        }),
        excludePaths: Property.Array({
            displayName: 'Skip Paths Matching',
            description: 'Regular expressions for paths to skip.',
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
            description: 'How to find pages. Empty: Auto.',
            required: false,
            options: {
                options: [
                    { label: 'Auto', value: 'auto' },
                    { label: 'Only the sitemap', value: 'force' },
                    { label: 'Ignore the sitemap', value: 'skip' },
                ],
            },
        }),
        formats: Property.StaticMultiSelectDropdown({
            displayName: 'Page Formats',
            description: 'What to store for each page. Empty: Markdown.',
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
            description: 'Drop navigation, headers and footers from each page.',
            required: false,
            defaultValue: true,
        }),
        proxy: browserlessProps.proxy({
            description: 'Proxy network. Empty: Residential; Datacenter is cheaper.',
            advanced: true,
        }),
    },
    outputSchema: browserlessOutputSchemas.startCrawl,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const limit = browserlessBody.optionalNumber({ value: props.limit, label: 'Maximum Pages', min: 1 }) ?? DEFAULT_LIMIT;
        const maxDepth = browserlessBody.optionalNumber({ value: props.maxDepth, label: 'Maximum Link Depth', min: 0, max: 20 });
        const includePaths = browserlessBody.textList(props.includePaths);
        const excludePaths = browserlessBody.textList(props.excludePaths);
        const formats = browserlessBody.textList(props.formats);
        const scrapeOptions = {
            ...(formats.length > 0 ? { formats } : {}),
            onlyMainContent: props.onlyMainContent !== false,
            ...(browserlessBody.nonEmpty(props.proxy) ? { proxy: props.proxy } : {}),
        };

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/crawl',
            body: {
                url,
                limit: Math.floor(limit),
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
