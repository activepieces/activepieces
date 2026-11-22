import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { BrowserlessApiError, browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

const DEFAULT_TIMEOUT_MS = 30_000;

export const runBqlQuery = createAction({
    name: 'run_bql_query',
    classification: 'WRITE',
    displayName: 'Run BQL Query',
    description: 'Run a Browser Query Language (BQL) query for advanced automation.',
    audience: 'both',
    aiMetadata: { description: 'Runs a raw Browser Query Language (BQL) GraphQL query against a headless Chromium browser for advanced automation such as navigation, clicking, typing, and multi-step scripted browser flows. Use when the simpler screenshot/scrape/PDF actions cannot express the interaction; requires a valid BQL query string and supports session options like stealth, proxy, and cookies. It fails when the query returns errors and no data; partial results keep their errors in the output. Not idempotent: the query can click, type and submit forms, so a retry can repeat those effects.', idempotent: false },
    auth: browserlessAuth,
    propertyGroups: [
        {
            key: 'query',
            display: 'section',
            label: 'Query',
            icon: 'code',
            props: ['query', 'operationName', 'variables', 'timeout'],
        },
        {
            key: 'session',
            display: 'section',
            label: 'Session',
            icon: 'sliders',
            props: ['stealth', 'headless', 'humanlike', 'blockAds', 'blockConsentModals', 'record'],
        },
        {
            key: 'network',
            display: 'section',
            label: 'Network',
            icon: 'send',
            props: ['proxyInfo', 'proxy', 'proxyCountry', 'proxySticky'],
        },
        {
            key: 'browser',
            display: 'section',
            label: 'Browser',
            icon: 'user',
            props: ['viewportInfo', 'viewportWidth', 'viewportHeight', 'userAgent', 'cookies'],
        },
    ],
    props: {
        query: Property.LongText({
            displayName: 'BQL Query',
            description: 'The BQL (GraphQL) query or mutation to run.',
            placeholder: 'mutation { goto(url: "https://example.com") { status } }',
            required: true,
        }),
        variables: Property.Object({
            displayName: 'Variables',
            description: 'Values for the variables your query declares.',
            required: false,
        }),
        operationName: Property.ShortText({
            displayName: 'Operation Name',
            description: 'Which operation to run when the query has several.',
            required: false,
        }),
        timeout: Property.Number({
            displayName: 'Timeout',
            description: 'Milliseconds the query may run.',
            required: false,
            defaultValue: DEFAULT_TIMEOUT_MS,
        }),

        stealth: Property.Checkbox({
            displayName: 'Stealth Mode',
            description: 'Hide signs of automation from bot detection.',
            required: false,
            defaultValue: true,
        }),
        headless: Property.Checkbox({
            displayName: 'Headless',
            description: 'Run without a visible browser window.',
            required: false,
            defaultValue: true,
        }),
        humanlike: Property.Checkbox({
            displayName: 'Human-like Behavior',
            description: 'Move the mouse and type with human-like delays.',
            required: false,
            defaultValue: false,
        }),
        proxyInfo: Property.MarkDown({
            value: 'Proxy Country and Sticky Proxy apply only when Proxy is Residential.',
            variant: MarkdownVariant.INFO,
        }),
        proxy: Property.StaticDropdown({
            displayName: 'Proxy',
            description: 'Route the browser through a residential proxy.',
            required: false,
            defaultValue: 'none',
            display: 'cards',
            options: {
                options: [
                    { label: 'None', value: 'none' },
                    { label: 'Residential', value: 'residential' },
                ]
            }
        }),
        proxyCountry: Property.ShortText({
            displayName: 'Proxy Country',
            description: 'Two-letter country code for the proxy exit.',
            placeholder: 'us',
            required: false,
        }),
        proxySticky: Property.Checkbox({
            displayName: 'Sticky Proxy',
            description: 'Keep the same proxy IP for the whole session.',
            required: false,
            defaultValue: false,
        }),
        blockAds: Property.Checkbox({
            displayName: 'Block Ads',
            description: 'Load pages with an ad blocker.',
            required: false,
            defaultValue: false,
        }),
        blockConsentModals: Property.Checkbox({
            displayName: 'Block Consent Modals',
            description: 'Dismiss cookie consent banners automatically.',
            required: false,
            defaultValue: false,
        }),
        record: Property.Checkbox({
            displayName: 'Record Session',
            description: 'Save a recording of the session for debugging.',
            required: false,
            defaultValue: false,
        }),
        slowMo: Property.Number({
            displayName: 'Slow Motion',
            description: 'Milliseconds to pause between browser actions.',
            required: false,
            advanced: true,
        }),
        ignoreHTTPSErrors: Property.Checkbox({
            displayName: 'Ignore HTTPS Errors',
            description: 'Open pages even when their certificate is invalid.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Browser user agent string to send instead of the default.',
            required: false,
        }),
        viewportInfo: Property.MarkDown({
            value: 'Set both width and height, or leave both empty.',
            variant: MarkdownVariant.INFO,
        }),
        viewportWidth: Property.Number({
            displayName: 'Viewport Width',
            description: 'Pixels.',
            required: false,
            width: 'half',
        }),
        viewportHeight: Property.Number({
            displayName: 'Viewport Height',
            description: 'Pixels.',
            required: false,
            width: 'half',
        }),
        cookies: Property.Array({
            displayName: 'Cookies',
            description: 'Cookies to set before the query runs.',
            required: false,
            properties: {
                name: Property.ShortText({
                    displayName: 'Cookie Name',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Cookie Value',
                    required: true,
                }),
                url: Property.ShortText({
                    displayName: 'URL',
                    description: 'Request-URI to associate with the cookie',
                    required: false,
                }),
                domain: Property.ShortText({
                    displayName: 'Domain',
                    required: false,
                }),
                path: Property.ShortText({
                    displayName: 'Path',
                    required: false,
                }),
                secure: Property.Checkbox({
                    displayName: 'Secure',
                    description: 'Indicates if the cookie is secure',
                    required: false,
                    defaultValue: false,
                }),
                httpOnly: Property.Checkbox({
                    displayName: 'HTTP Only',
                    description: 'Indicates if the cookie is HTTP-only',
                    required: false,
                    defaultValue: false,
                }),
                sameSite: Property.StaticDropdown({
                    displayName: 'SameSite',
                    description: 'SameSite policy for the cookie',
                    required: false,
                    options: {
                        options: [
                            { label: 'Strict', value: 'Strict' },
                            { label: 'Lax', value: 'Lax' },
                            { label: 'None', value: 'None' }
                        ]
                    }
                }),
                expires: Property.Number({
                    displayName: 'Expires',
                    description: 'Unix timestamp in seconds. Empty: a session cookie.',
                    required: false,
                }),
            }
        }),
    },
    outputSchema: browserlessOutputSchemas.runBqlQuery,
    async run(context) {
        const props = context.propsValue;
        if (!browserlessBody.nonEmpty(props.query)) {
            throw new Error('Enter a BQL query.');
        }
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1 }) ?? DEFAULT_TIMEOUT_MS;
        const slowMo = browserlessBody.optionalNumber({ value: props.slowMo, label: 'Slow Motion', min: 0 });
        const viewportWidth = browserlessBody.optionalNumber({ value: props.viewportWidth, label: 'Viewport Width', min: 1 });
        const viewportHeight = browserlessBody.optionalNumber({ value: props.viewportHeight, label: 'Viewport Height', min: 1 });
        const useProxy = browserlessBody.nonEmpty(props.proxy) && props.proxy !== 'none';
        const cookies = (props.cookies ?? [])
            .map(browserlessValues.record)
            .filter((cookie) => browserlessBody.nonEmpty(String(cookie['name'] ?? '')))
            .map((cookie) => ({
                name: String(cookie['name']),
                value: String(cookie['value'] ?? ''),
                ...(browserlessBody.nonEmpty(stringOrUndefined(cookie['url'])) ? { url: cookie['url'] } : {}),
                ...(browserlessBody.nonEmpty(stringOrUndefined(cookie['domain'])) ? { domain: cookie['domain'] } : {}),
                ...(browserlessBody.nonEmpty(stringOrUndefined(cookie['path'])) ? { path: cookie['path'] } : {}),
                ...(typeof cookie['secure'] === 'boolean' ? { secure: cookie['secure'] } : {}),
                ...(typeof cookie['httpOnly'] === 'boolean' ? { httpOnly: cookie['httpOnly'] } : {}),
                ...(browserlessBody.nonEmpty(stringOrUndefined(cookie['sameSite'])) ? { sameSite: cookie['sameSite'] } : {}),
                ...(cookie['expires'] !== undefined && cookie['expires'] !== null && cookie['expires'] !== '' ? { expires: Number(cookie['expires']) } : {}),
            }));

        const query = {
            timeout,
            stealth: props.stealth !== false,
            headless: props.headless !== false,
            humanlike: props.humanlike === true ? true : undefined,
            proxy: useProxy ? props.proxy : undefined,
            proxyCountry: useProxy && browserlessBody.nonEmpty(props.proxyCountry) ? props.proxyCountry.trim() : undefined,
            proxySticky: useProxy && props.proxySticky === true ? true : undefined,
            blockAds: props.blockAds === true ? true : undefined,
            blockConsentModals: props.blockConsentModals === true ? true : undefined,
            record: props.record === true ? true : undefined,
            slowMo,
            ignoreHTTPSErrors: props.ignoreHTTPSErrors === true ? true : undefined,
            userAgent: browserlessBody.nonEmpty(props.userAgent) ? props.userAgent.trim() : undefined,
            viewport: viewportWidth !== undefined && viewportHeight !== undefined ? `${viewportWidth}x${viewportHeight}` : undefined,
            cookies: cookies.length > 0 ? JSON.stringify(cookies) : undefined,
        };

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/chromium/bql',
            body: {
                query: props.query,
                ...(props.variables && Object.keys(props.variables).length > 0 ? { variables: props.variables } : {}),
                ...(browserlessBody.nonEmpty(props.operationName) ? { operationName: props.operationName.trim() } : {}),
            },
            query,
            timeoutMs: timeout + 30_000,
            operation: 'Run BQL Query',
        });

        const parsed = parseBody(response.body);
        const data = readField({ value: parsed, key: 'data' });
        const errors = readField({ value: parsed, key: 'errors' });
        const hasData = data !== null && typeof data === 'object' && Object.keys(data).length > 0;
        if (!hasData && Array.isArray(errors) && errors.length > 0) {
            throw new BrowserlessApiError({
                message: `Run BQL Query failed: ${errors.map(errorText).join('; ').slice(0, 1000)}`,
                status: response.status,
                responseBody: parsed,
            });
        }

        return {
            success: true,
            data: hasData ? data : null,
            errors: Array.isArray(errors) && errors.length > 0 ? errors : null,
            result: parsed,
            metadata: {
                browserType: 'chromium',
                executionTime: browserlessApi.headerValue({ headers: response.headers, name: 'x-response-time' }) ?? 'unknown',
                timestamp: new Date().toISOString(),
                stealth: props.stealth !== false,
            },
        };
    },
});

function parseBody(body: unknown): unknown {
    if (typeof body !== 'string') {
        return body;
    }
    try {
        return JSON.parse(body);
    } catch {
        return body;
    }
}

function readField({ value, key }: { value: unknown; key: string }): unknown {
    if (typeof value !== 'object' || value === null) {
        return null;
    }
    const field: unknown = Reflect.get(value, key);
    return field ?? null;
}

function errorText(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return JSON.stringify(error);
}

function stringOrUndefined(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}
