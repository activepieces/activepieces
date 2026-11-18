import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody, browserlessProps } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const unblockPage = createAction({
    auth: browserlessAuth,
    name: 'unblock_page',
    classification: 'READ',
    displayName: 'Unblock Page',
    description: 'Open a page that blocks bots (Cloudflare, CAPTCHAs and similar) and return its HTML, cookies and a screenshot.',
    audience: 'both',
    aiMetadata: {
        description:
            'Opens a bot-protected URL in a stealth browser, solving CAPTCHAs when enabled, and returns the unblocked HTML (cut to Maximum Characters, default 100000), the session cookies and optionally a screenshot file. Use only when Get Page Content or Smart Scrape is blocked, because it is slower and costs more (residential proxy 6 units/MB, 10 units per solved CAPTCHA). Each call stores a new screenshot file.',
        idempotent: false,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'The blocked page to open, for example https://example.com/products' }),
        returnContent: Property.Checkbox({
            displayName: 'Return HTML',
            description: 'Return the page HTML.',
            required: false,
            defaultValue: true,
        }),
        returnCookies: Property.Checkbox({
            displayName: 'Return Cookies',
            description: 'Return the cookies the site set, so later requests can reuse the unblocked session.',
            required: false,
            defaultValue: true,
        }),
        returnScreenshot: Property.Checkbox({
            displayName: 'Return Screenshot',
            description: 'Return a full-page screenshot as a file.',
            required: false,
            defaultValue: false,
        }),
        solveCaptchas: Property.Checkbox({
            displayName: 'Solve CAPTCHAs',
            description: 'Let Browserless solve CAPTCHAs it meets (10 units per successful solve).',
            required: false,
            defaultValue: false,
        }),
        proxy: browserlessProps.proxy({
            description: 'Proxy network to route the browser through. Residential works best against bot detection.',
        }),
        proxyCountry: Property.ShortText({
            displayName: 'Proxy Country',
            description: 'Two-letter country code for the proxy exit, for example `us` or `de`.',
            required: false,
        }),
        waitUntil: browserlessProps.waitUntil(),
        navigationTimeout: browserlessProps.navigationTimeout(),
        waitForSelector: browserlessProps.waitForSelector(),
        waitForTimeout: browserlessProps.waitForTimeout(),
        bestAttempt: browserlessProps.bestAttempt(),
        maxCharacters: browserlessProps.maxCharacters(),
        timeout: browserlessProps.sessionTimeout(),
    },
    outputSchema: browserlessOutputSchemas.unblockPage,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1000, max: 540_000 });
        const useProxy = browserlessBody.nonEmpty(props.proxy);
        const returnContent = props.returnContent !== false;
        const returnCookies = props.returnCookies !== false;
        const returnScreenshot = props.returnScreenshot === true;

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/unblock',
            body: {
                url,
                content: returnContent,
                cookies: returnCookies,
                screenshot: returnScreenshot,
                browserWSEndpoint: false,
                ...browserlessBody.pageOptions(props),
            },
            query: {
                proxy: useProxy ? props.proxy : undefined,
                proxyCountry: useProxy && browserlessBody.nonEmpty(props.proxyCountry) ? props.proxyCountry.trim().toLowerCase() : undefined,
                solveCaptchas: props.solveCaptchas === true ? true : undefined,
                timeout,
            },
            timeoutMs: timeout === undefined ? undefined : timeout + 30_000,
            operation: 'Unblock Page',
        });

        const body = browserlessValues.record(response.body);
        const fullHtml = browserlessValues.stringOrNull(body['content']);
        const html = browserlessBody.cap({ text: fullHtml, max: browserlessBody.maxCharacters(props.maxCharacters) });
        const cookies = Array.isArray(body['cookies']) ? body['cookies'].map(toCookie) : [];
        const screenshotFile = await browserlessValues.writeBase64File({ files: context.files, value: body['screenshot'], fileName: 'unblocked.jpg' });
        return {
            url,
            solved: browserlessValues.booleanOrNull(body['solved']),
            html: html.text,
            html_length: fullHtml === null ? 0 : fullHtml.length,
            truncated: html.truncated,
            cookie_count: cookies.length,
            cookies,
            cookie_header: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
            screenshot_file: screenshotFile,
        };
    },
});

function toCookie(entry: unknown) {
    const item = browserlessValues.record(entry);
    return {
        name: browserlessValues.stringOrNull(item['name']) ?? '',
        value: browserlessValues.stringOrNull(item['value']) ?? '',
        domain: browserlessValues.stringOrNull(item['domain']),
        path: browserlessValues.stringOrNull(item['path']),
        expires: browserlessValues.numberOrNull(item['expires']),
        http_only: browserlessValues.booleanOrNull(item['httpOnly']),
        secure: browserlessValues.booleanOrNull(item['secure']),
        same_site: browserlessValues.stringOrNull(item['sameSite']),
    };
}
