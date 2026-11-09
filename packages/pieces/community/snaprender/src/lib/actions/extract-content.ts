import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderApi } from '../common/client';
import { snaprenderBody, snaprenderProps } from '../common/props';
import { snaprenderOutputSchemas } from '../output-schemas';

export const extractContent = createAction({
    auth: snaprenderAuth,
    name: 'extract_content',
    classification: 'READ',
    displayName: 'Extract Content',
    description: 'Read a web page after it loads in a browser and get its text as Markdown, plain text, HTML, the main article, its links or its metadata.',
    audience: 'both',
    aiMetadata: {
        description:
            'Loads a public web page in a real browser (JavaScript runs) and returns its content as Markdown, plain text, HTML, the main article, the list of links or the SEO and social metadata. Use it to read or summarize a page; for how the page looks use Take Screenshot. Selector limits extraction to one part of the page. Each call uses one capture from the monthly quota.',
        idempotent: false,
    },
    props: {
        url: snaprenderProps.url({ description: 'Address of the page to read. It must be reachable from the internet.' }),
        type: Property.StaticDropdown({
            displayName: 'Extract',
            description: 'What to get from the page.',
            required: true,
            defaultValue: 'markdown',
            options: {
                options: [
                    { label: 'Markdown (text with headings and links)', value: 'markdown' },
                    { label: 'Plain text', value: 'text' },
                    { label: 'HTML', value: 'html' },
                    { label: 'Main article (title, author, body)', value: 'article' },
                    { label: 'Links', value: 'links' },
                    { label: 'Metadata (title, description, social tags)', value: 'metadata' },
                ],
            },
        }),
        selector: Property.ShortText({
            displayName: 'Selector',
            description: 'Only read the part of the page that matches this CSS selector. Used by Markdown, Plain text, HTML and Links.',
            required: false,
            placeholder: 'main, article, #content',
        }),
        maxLength: Property.Number({
            displayName: 'Maximum Length',
            description: 'Cut the content to this many characters, 1 to 500000. Default 100000.',
            required: false,
            advanced: true,
        }),
        delay: snaprenderProps.delay(),
        blockAds: snaprenderProps.blockAds(),
        blockCookieBanners: snaprenderProps.blockCookieBanners(),
        useCache: snaprenderProps.useCache(),
        cacheTtl: snaprenderProps.cacheTtl(),
    },
    outputSchema: snaprenderOutputSchemas.extract,
    async run(context) {
        const props = context.propsValue;
        const type = EXTRACT_TYPES.find((option) => option === props.type) ?? 'markdown';
        const maxLength = snaprenderBody.optionalNumber({ value: props.maxLength, label: 'Maximum Length', min: 1, max: 500000 });
        const delay = snaprenderBody.optionalNumber({ value: props.delay, label: 'Delay', min: 0, max: 10000 });
        const response = await snaprenderApi.request<ExtractResponse>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.POST,
            path: '/v1/extract',
            body: {
                url: snaprenderBody.pageUrl({ value: props.url, label: 'Page URL' }),
                type,
                block_ads: props.blockAds !== false,
                block_cookie_banners: props.blockCookieBanners !== false,
                ...(snaprenderBody.nonEmpty(props.selector) ? { selector: props.selector.trim() } : {}),
                ...(maxLength !== undefined ? { max_length: maxLength } : {}),
                ...(delay !== undefined ? { delay } : {}),
                ...snaprenderBody.cacheOptions(props),
            },
            slowPageHint: true,
        });
        return toOutput({ body: response.body, type });
    },
});

function toOutput({ body, type }: { body: ExtractResponse; type: ExtractType }): ExtractOutput {
    const content = body.content;
    const record = isRecord(content) ? content : {};
    const links = Array.isArray(content) ? content.filter(isRecord).map((link) => ({ url: text(link['href']), text: text(link['text']) })) : [];
    return {
        url: body.url ?? null,
        type: body.type ?? type,
        content: typeof content === 'string' ? content : type === 'article' ? text(record['content']) : null,
        word_count: typeof body.wordCount === 'number' ? body.wordCount : null,
        title: text(record['title']),
        author: text(record['author']),
        excerpt: text(record['excerpt']),
        description: text(record['description']),
        canonical_url: text(record['canonical']),
        og_title: text(record['ogTitle']),
        og_description: text(record['ogDescription']),
        og_image: text(record['ogImage']),
        og_url: text(record['ogUrl']),
        og_type: text(record['ogType']),
        twitter_card: text(record['twitterCard']),
        twitter_title: text(record['twitterTitle']),
        twitter_description: text(record['twitterDescription']),
        twitter_image: text(record['twitterImage']),
        links,
        link_count: links.length,
        processing_time_ms: typeof body.processingTimeMs === 'number' ? body.processingTimeMs : null,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

const EXTRACT_TYPES = ['markdown', 'text', 'html', 'article', 'links', 'metadata'] as const;

type ExtractType = (typeof EXTRACT_TYPES)[number];

type ExtractResponse = {
    url?: string;
    type?: string;
    content?: unknown;
    wordCount?: number;
    processingTimeMs?: number;
};

type ExtractOutput = {
    url: string | null;
    type: string;
    content: string | null;
    word_count: number | null;
    title: string | null;
    author: string | null;
    excerpt: string | null;
    description: string | null;
    canonical_url: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
    og_url: string | null;
    og_type: string | null;
    twitter_card: string | null;
    twitter_title: string | null;
    twitter_description: string | null;
    twitter_image: string | null;
    links: { url: string | null; text: string | null }[];
    link_count: number;
    processing_time_ms: number | null;
};
