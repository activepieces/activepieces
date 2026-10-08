import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const smartScrape = createAction({
    auth: browserlessAuth,
    name: 'smart_scrape',
    classification: 'READ',
    displayName: 'Smart Scrape',
    description: 'Get a page as markdown, text, HTML or links. Browserless tries a fast fetch first and falls back to a real browser, proxy or CAPTCHA solving when the site blocks it.',
    audience: 'both',
    aiMetadata: {
        description:
            'Reads one web page and returns it as LLM-ready markdown (default), plain text, HTML and/or the list of links, with title and description, escalating from a plain fetch to a stealth browser when the site blocks bots. Use this to read or summarise a page; use Scrape URL for specific CSS selectors and Capture Screenshot for images. Text fields are cut to Maximum Characters (default 100000) and truncated=true says so. Fails when every strategy fails. Asking for a screenshot or PDF stores a new file on each call.',
        idempotent: false,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'The page to read, for example https://example.com/blog/post' }),
        formats: Property.StaticMultiSelectDropdown({
            displayName: 'Formats',
            description: 'What to return. Markdown is the best choice for AI steps.',
            required: false,
            defaultValue: ['markdown'],
            options: {
                options: [
                    { label: 'Markdown', value: 'markdown' },
                    { label: 'Plain Text', value: 'rawText' },
                    { label: 'HTML', value: 'html' },
                    { label: 'Links', value: 'links' },
                    { label: 'Screenshot (file)', value: 'screenshot' },
                    { label: 'PDF (file)', value: 'pdf' },
                ],
            },
        }),
        onlyMainContent: Property.Checkbox({
            displayName: 'Only Main Content',
            description: 'Drop navigation, headers, footers and sidebars.',
            required: false,
            defaultValue: false,
        }),
        includeTags: Property.Array({
            displayName: 'Keep Only These Selectors',
            description: 'CSS selectors to keep; cannot be combined with Remove or Only Main Content.',
            required: false,
        }),
        excludeTags: Property.Array({
            displayName: 'Remove These Selectors',
            description: 'CSS selectors to remove (for example `.cookie-banner`).',
            required: false,
        }),
        waitFor: Property.Number({
            displayName: 'Extra Wait (ms)',
            description: 'Wait after load (0-30000 ms); above 0 forces a real browser.',
            required: false,
        }),
        proxy: browserlessProps.proxy({
            description: 'Proxy network used when a plain fetch is blocked. Browserless uses Residential when empty; Datacenter is cheaper.',
        }),
        maxCharacters: browserlessProps.maxCharacters(),
        timeout: browserlessProps.sessionTimeout(),
    },
    outputSchema: browserlessOutputSchemas.smartScrape,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const formats = browserlessBody.textList(props.formats);
        const maxCharacters = browserlessBody.maxCharacters(props.maxCharacters);
        const includeTags = browserlessBody.textList(props.includeTags);
        const excludeTags = browserlessBody.textList(props.excludeTags);
        if (includeTags.length > 0 && (excludeTags.length > 0 || props.onlyMainContent === true)) {
            throw new Error('"Keep Only These Selectors" cannot be combined with "Remove These Selectors" or "Only Main Content".');
        }
        if (includeTags.length > 100 || excludeTags.length > 100) {
            throw new Error('Use at most 100 selectors.');
        }
        const waitFor = browserlessBody.optionalNumber({ value: props.waitFor, label: 'Extra Wait', min: 0, max: 30_000 });
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/smart-scrape',
            body: {
                url,
                formats: formats.length > 0 ? formats : ['markdown'],
                ...(props.onlyMainContent === true ? { onlyMainContent: true } : {}),
                ...(includeTags.length > 0 ? { includeTags } : {}),
                ...(excludeTags.length > 0 ? { excludeTags } : {}),
                ...(waitFor !== undefined ? { waitFor } : {}),
                ...(browserlessBody.nonEmpty(props.proxy) ? { proxy: props.proxy } : {}),
            },
            query: { timeout },
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Smart Scrape',
        });

        const body = browserlessValues.record(response.body);
        if (body['ok'] !== true) {
            const message = typeof body['message'] === 'string' && body['message'] !== '' ? body['message'] : 'every scraping strategy failed';
            throw new BrowserlessApiError({
                message: `Smart Scrape failed for ${url}: ${message}`,
                status: typeof body['statusCode'] === 'number' ? body['statusCode'] : null,
                responseBody: { ok: body['ok'], message: body['message'], attempted: body['attempted'] },
            });
        }

        const metadata = browserlessValues.record(body['metadata']);
        const content = body['content'];
        const isHtml = (browserlessValues.stringOrNull(body['contentType']) ?? 'text/html').toLowerCase().includes('html');
        const screenshot = await browserlessValues.writeBase64File({ files: context.files, value: body['screenshot'], fileName: 'smart-scrape.png' });
        const pdf = await browserlessValues.writeBase64File({ files: context.files, value: body['pdf'], fileName: 'smart-scrape.pdf' });
        const markdown = browserlessBody.cap({ text: browserlessValues.stringOrNull(body['markdown']), max: maxCharacters });
        const rawText = browserlessBody.cap({ text: browserlessValues.stringOrNull(body['rawText']), max: maxCharacters });
        const html = browserlessBody.cap({ text: isHtml && formats.includes('html') && typeof content === 'string' ? content : null, max: maxCharacters });
        const otherContent = isHtml ? { value: null, truncated: false } : capContent({ content, max: maxCharacters });
        const links = Array.isArray(body['links']) ? browserlessValues.stringList(body['links']) : null;

        return {
            url,
            status_code: browserlessValues.numberOrNull(body['statusCode']),
            content_type: browserlessValues.stringOrNull(body['contentType']),
            strategy: browserlessValues.stringOrNull(body['strategy']),
            attempted_strategies: browserlessValues.stringList(body['attempted']),
            title: browserlessValues.stringOrNull(metadata['title']),
            description: browserlessValues.stringOrNull(metadata['description']),
            language: browserlessValues.stringOrNull(metadata['language']),
            source_url: browserlessValues.stringOrNull(metadata['sourceURL']),
            markdown: markdown.text,
            raw_text: rawText.text,
            html: html.text,
            content: otherContent.value,
            truncated: markdown.truncated || rawText.truncated || html.truncated || otherContent.truncated,
            links,
            links_count: links === null ? 0 : links.length,
            screenshot_file: screenshot,
            pdf_file: pdf,
        };
    },
});


function capContent({ content, max }: { content: unknown; max: number }): { value: unknown; truncated: boolean } {
    if (content === undefined || content === null) {
        return { value: null, truncated: false };
    }
    if (typeof content === 'string') {
        const capped = browserlessBody.cap({ text: content, max });
        return { value: capped.text, truncated: capped.truncated };
    }
    const serialized = JSON.stringify(content);
    if (max === 0 || serialized === undefined || serialized.length <= max) {
        return { value: content, truncated: false };
    }
    return { value: serialized.slice(0, max), truncated: true };
}
