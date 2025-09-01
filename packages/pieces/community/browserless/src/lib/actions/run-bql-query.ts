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
        timeout: Property.Number({
            displayName: 'Timeout (ms)',
            description: 'Maximum execution time in milliseconds',
            required: false,
            defaultValue: 30000,
        }),
        browserType: Property.StaticDropdown({
            displayName: 'Browser Type',
            description: 'Browser engine to use for the query',
            required: false,
            defaultValue: 'chromium',
            options: {
                options: [
                    { label: 'Chromium', value: 'chromium' },
                    { label: 'Firefox', value: 'firefox' },
                    { label: 'WebKit', value: 'webkit' }
                ]
            }
        }),
        stealth: Property.Checkbox({
            displayName: 'Stealth Mode',
            description: 'Enable stealth mode for bot detection bypass',
            required: false,
            defaultValue: true,
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
            description: 'Cookies to set before executing code',
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
                domain: Property.ShortText({
                    displayName: 'Domain',
                    required: false,
                }),
                path: Property.ShortText({
                    displayName: 'Path',
                    required: false,
                }),
            }
        }),
    },
    async run(context) {
        const browserType = context.propsValue.browserType || 'chromium';
        const requestBody: any = {
            query: context.propsValue.query,
        };

        if (context.propsValue.variables) {
            requestBody.variables = context.propsValue.variables;
        }

        const bqlEndpoint = `/${browserType}/bql`;
        let resourceUri = bqlEndpoint;

        const queryParams: string[] = [];

        if (context.propsValue.timeout) {
            queryParams.push(`timeout=${context.propsValue.timeout}`);
        }

        if (context.propsValue.stealth) {
            queryParams.push('stealth=true');
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
                ...(cookie.domain && { domain: cookie.domain }),
                ...(cookie.path && { path: cookie.path })
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
                browserType: browserType,
                executionTime: response.headers?.['x-response-time'] || 'unknown',
                timestamp: new Date().toISOString(),
                stealth: context.propsValue.stealth || false,
            }
        };
    },
});
