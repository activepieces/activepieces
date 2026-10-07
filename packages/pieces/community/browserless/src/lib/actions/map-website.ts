import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const mapWebsite = createAction({
    auth: browserlessAuth,
    name: 'map_website',
    classification: 'SEARCH',
    displayName: 'Map Website URLs',
    description: 'List the URLs of a website from its sitemap and links, optionally ordered by relevance to a search term.',
    audience: 'both',
    aiMetadata: {
        description:
            'Discovers the URLs of a website from its sitemap plus links found on the page and returns them as a list (500 by default, up to 5000), optionally ranked by a search term. Use to find which pages exist before scraping or crawling them; it does not return page content (use Smart Scrape or Start Crawl for that). Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'The website to map, for example https://example.com' }),
        search: Property.ShortText({
            displayName: 'Search Term',
            description: 'Order the URLs by relevance to this term, for example `pricing`.',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Maximum URLs',
            description: 'How many URLs to return (1-5000, default 500).',
            required: false,
        }),
        sitemap: Property.StaticDropdown({
            displayName: 'Sitemap',
            description: 'How to use the site\'s sitemap.',
            required: false,
            options: {
                options: [
                    { label: 'Use sitemap and page links (default)', value: 'include' },
                    { label: 'Only the sitemap', value: 'only' },
                    { label: 'Ignore the sitemap', value: 'skip' },
                ],
            },
        }),
        includeSubdomains: Property.Checkbox({
            displayName: 'Include Subdomains',
            description: 'Also return URLs on subdomains such as blog.example.com.',
            required: false,
            defaultValue: true,
        }),
        ignoreQueryParameters: Property.Checkbox({
            displayName: 'Ignore Query Parameters',
            description: 'Skip URLs that only differ by their ?query part.',
            required: false,
            defaultValue: true,
        }),
        proxy: browserlessProps.proxy({
            description: 'Proxy network for fetching the site. Browserless uses Residential when empty; Datacenter is cheaper.',
        }),
        timeout: browserlessProps.sessionTimeout(),
    },
    outputSchema: browserlessOutputSchemas.mapWebsite,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const limit = browserlessBody.optionalNumber({ value: props.limit, label: 'Maximum URLs', min: 1, max: 5000 });
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/map',
            body: {
                url,
                ...(browserlessBody.nonEmpty(props.search) ? { search: props.search.trim() } : {}),
                limit: limit === undefined ? DEFAULT_LIMIT : Math.floor(limit),
                ...(browserlessBody.nonEmpty(props.sitemap) ? { sitemap: props.sitemap } : {}),
                ...(typeof props.includeSubdomains === 'boolean' ? { includeSubdomains: props.includeSubdomains } : {}),
                ...(typeof props.ignoreQueryParameters === 'boolean' ? { ignoreQueryParameters: props.ignoreQueryParameters } : {}),
                ...(browserlessBody.nonEmpty(props.proxy) ? { proxy: props.proxy } : {}),
                ...(timeout !== undefined ? { timeout } : {}),
            },
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Map Website URLs',
        });

        const links = toLinks(response.body);
        if (links === null) {
            const body = browserlessValues.record(response.body);
            throw new BrowserlessApiError({
                message: `Map Website URLs failed: ${browserlessValues.stringOrNull(body['error']) ?? browserlessValues.stringOrNull(body['message']) ?? 'unexpected response from Browserless'}`,
                status: response.status,
                responseBody: body,
            });
        }
        return {
            url,
            count: links.length,
            links,
        };
    },
});

function toLinks(body: unknown): MappedLink[] | null {
    const record = browserlessValues.record(body);
    const raw = Array.isArray(body) ? body : record['success'] === false ? null : Array.isArray(record['links']) ? record['links'] : null;
    if (raw === null) {
        return null;
    }
    return raw
        .map((entry: unknown) => {
            if (typeof entry === 'string') {
                return { url: entry, title: null, description: null };
            }
            const item = browserlessValues.record(entry);
            return {
                url: browserlessValues.stringOrNull(item['url']) ?? '',
                title: browserlessValues.stringOrNull(item['title']),
                description: browserlessValues.stringOrNull(item['description']),
            };
        })
        .filter((link) => link.url !== '');
}

type MappedLink = { url: string; title: string | null; description: string | null };

const DEFAULT_LIMIT = 500;
