import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessCommon } from '../common/client';

export const runBqlQuery = createAction({
    name: 'run_bql_query',
    displayName: 'Run BQL Query',
    description: 'Execute Browser Query Language (BQL) GraphQL-based queries for advanced browser automation',
    auth: browserlessAuth,
    props: {
        query: Property.LongText({
            displayName: 'BQL Query',
            description: 'GraphQL-based BQL query for browser automation. Example: mutation { goto(url: "https://example.com") { status } }',
            required: true,
        }),
        variables: Property.Object({
            displayName: 'Query Variables',
            description: 'Variables to pass to the BQL query (JSON object)',
            required: false,
        }),
        operationName: Property.ShortText({
            displayName: 'Operation Name',
            description: 'Name of the GraphQL operation to execute',
            required: false,
        }),
        timeout: Property.Number({
            displayName: 'Timeout (ms)',
            description: 'Maximum execution time in milliseconds',
            required: false,
            defaultValue: 30000,
        }),

        stealth: Property.Checkbox({
            displayName: 'Stealth Mode',
            description: 'Enable stealth mode for bot detection bypass',
            required: false,
            defaultValue: true,
        }),
        headless: Property.Checkbox({
            displayName: 'Headless Mode',
            description: 'Run browser in headless mode (set to false for GUI)',
            required: false,
            defaultValue: true,
        }),
        humanlike: Property.Checkbox({
            displayName: 'Human-like Behavior',
            description: 'Enable human-like mouse movement, typing, and delays',
            required: false,
            defaultValue: false,
        }),
        proxy: Property.StaticDropdown({
            displayName: 'Proxy Type',
            description: 'Type of proxy to use',
            required: false,
            options: {
                options: [
                    { label: 'Residential', value: 'residential' },
                    { label: 'None', value: 'none' }
                ]
            }
        }),
        proxyCountry: Property.ShortText({
            displayName: 'Proxy Country',
            description: 'Country code for residential proxy (e.g., us, gb, de)',
            required: false,
        }),
        proxySticky: Property.Checkbox({
            displayName: 'Sticky Proxy',
            description: 'Maintain same proxy IP across session',
            required: false,
            defaultValue: false,
        }),
        blockAds: Property.Checkbox({
            displayName: 'Block Ads',
            description: 'Enable ad blocker (uBlock Origin)',
            required: false,
            defaultValue: false,
        }),
        blockConsentModals: Property.Checkbox({
            displayName: 'Block Consent Modals',
            description: 'Automatically block/dismiss cookie consent banners',
            required: false,
            defaultValue: false,
        }),
        record: Property.Checkbox({
            displayName: 'Record Session',
            description: 'Enable session recording for debugging',
            required: false,
            defaultValue: false,
        }),
        slowMo: Property.Number({
            displayName: 'Slow Motion (ms)',
            description: 'Add delays between browser actions in milliseconds',
            required: false,
        }),
        ignoreHTTPSErrors: Property.Checkbox({
            displayName: 'Ignore HTTPS Errors',
            description: 'Ignore HTTPS certificate errors during navigation',
            required: false,
            defaultValue: false,
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Custom user agent string',
            required: false,
        }),
        viewportWidth: Property.Number({
            displayName: 'Viewport Width',
            description: 'Browser viewport width',
            required: false,
        }),
        viewportHeight: Property.Number({
            displayName: 'Viewport Height',
            description: 'Browser viewport height',
            required: false,
        }),
        cookies: Property.Array({
            displayName: 'Cookies',
            description: 'Cookies to set before executing BQL query',
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
                    description: 'Expiration date as timestamp (session cookie if not set)',
                    required: false,
                }),
            }
        }),
    },
    async run(context) {
        const requestBody: any = {
            query: context.propsValue.query,
        };

        if (context.propsValue.variables) {
            requestBody.variables = context.propsValue.variables;
        }

        if (context.propsValue.operationName) {
            requestBody.operationName = context.propsValue.operationName;
        }

        let resourceUri = '/chromium/bql';

        const queryParams: string[] = [];

        if (context.propsValue.timeout) {
            queryParams.push(`timeout=${context.propsValue.timeout}`);
        }

        if (context.propsValue.stealth !== undefined) {
            queryParams.push(`stealth=${context.propsValue.stealth}`);
        }

        if (context.propsValue.headless !== undefined) {
            queryParams.push(`headless=${context.propsValue.headless}`);
        }

        if (context.propsValue.humanlike) {
            queryParams.push(`humanlike=true`);
        }

        if (context.propsValue.proxy && context.propsValue.proxy !== 'none') {
            queryParams.push(`proxy=${context.propsValue.proxy}`);
            if (context.propsValue.proxyCountry) {
                queryParams.push(`proxyCountry=${context.propsValue.proxyCountry}`);
            }
            if (context.propsValue.proxySticky) {
                queryParams.push(`proxySticky=true`);
            }
        }

        if (context.propsValue.blockAds) {
            queryParams.push(`blockAds=true`);
        }

        if (context.propsValue.blockConsentModals) {
            queryParams.push(`blockConsentModals=true`);
        }

        if (context.propsValue.record) {
            queryParams.push(`record=true`);
        }

        if (context.propsValue.slowMo) {
            queryParams.push(`slowMo=${context.propsValue.slowMo}`);
        }

        if (context.propsValue.ignoreHTTPSErrors) {
            queryParams.push(`ignoreHTTPSErrors=true`);
        }

        if (context.propsValue.userAgent) {
            queryParams.push(`userAgent=${encodeURIComponent(context.propsValue.userAgent)}`);
        }

        if (context.propsValue.viewportWidth && context.propsValue.viewportHeight) {
            queryParams.push(`viewport=${context.propsValue.viewportWidth}x${context.propsValue.viewportHeight}`);
        }

        if (context.propsValue.cookies && context.propsValue.cookies.length > 0) {
            const cookiesJson = JSON.stringify(context.propsValue.cookies.map((cookie: any) => ({
                name: cookie.name,
                value: cookie.value,
                ...(cookie.url && { url: cookie.url }),
                ...(cookie.domain && { domain: cookie.domain }),
                ...(cookie.path && { path: cookie.path }),
                ...(cookie.secure !== undefined && { secure: cookie.secure }),
                ...(cookie.httpOnly !== undefined && { httpOnly: cookie.httpOnly }),
                ...(cookie.sameSite && { sameSite: cookie.sameSite }),
                ...(cookie.expires !== undefined && { expires: cookie.expires })
            })));
            queryParams.push(`cookies=${encodeURIComponent(cookiesJson)}`);
        }

        if (queryParams.length > 0) {
            resourceUri += `?${queryParams.join('&')}`;
        }

        const response = await browserlessCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri,
            body: requestBody,
        });

        let parsedResult;
        try {
            parsedResult = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        } catch (error) {
            parsedResult = response.body;
        }

        return {
            success: true,
            data: parsedResult?.data || null,
            errors: parsedResult?.errors || null,
            result: parsedResult,
            metadata: {
                browserType: 'chromium',
                executionTime: response.headers?.['x-response-time'] || 'unknown',
                timestamp: new Date().toISOString(),
                stealth: context.propsValue.stealth || false,
            }
        };
    },
});
