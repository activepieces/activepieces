import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessCommon } from '../common/client';

export const scrapeUrl = createAction({
    name: 'scrape_url',
    displayName: 'Scrape URL',
    description: 'Extract content from a web page',
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The URL of the page to scrape',
            required: true,
        }),
        elements: Property.Array({
            displayName: 'Elements to Extract',
            description: 'CSS selectors for elements to extract',
            required: true,
            properties: {
                selector: Property.ShortText({
                    displayName: 'CSS Selector',
                    description: 'CSS selector for the element',
                    required: true,
                }),
                timeout: Property.Number({
                    displayName: 'Timeout (ms)',
                    description: 'Timeout in milliseconds for this specific selector',
                    required: false,
                }),
            }
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before scraping',
            required: false,
        }),
        waitForSelectorTimeout: Property.Number({
            displayName: 'Wait for Selector Timeout',
            description: 'Timeout in milliseconds for waiting for selector',
            required: false,
        }),
        waitForSelectorVisible: Property.Checkbox({
            displayName: 'Wait for Selector Visible',
            description: 'Wait for selector to be visible',
            required: false,
            defaultValue: true,
        }),
        waitForSelectorHidden: Property.Checkbox({
            displayName: 'Wait for Selector Hidden',
            description: 'Wait for selector to be hidden',
            required: false,
            defaultValue: false,
        }),
        waitForTimeout: Property.Number({
            displayName: 'Wait Timeout (ms)',
            description: 'Timeout in milliseconds to wait before scraping',
            required: false,
        }),
        waitForEvent: Property.ShortText({
            displayName: 'Wait for Event',
            description: 'Event name to wait for before scraping',
            required: false,
        }),
        waitForEventTimeout: Property.Number({
            displayName: 'Wait for Event Timeout',
            description: 'Timeout in milliseconds for wait event',
            required: false,
        }),
        debugConsole: Property.Checkbox({
            displayName: 'Debug Console',
            description: 'Include console logs in debug output',
            required: false,
            defaultValue: false,
        }),
        debugCookies: Property.Checkbox({
            displayName: 'Debug Cookies',
            description: 'Include cookies in debug output',
            required: false,
            defaultValue: false,
        }),
        debugNetwork: Property.Checkbox({
            displayName: 'Debug Network',
            description: 'Include network requests in debug output',
            required: false,
            defaultValue: false,
        }),
        bestAttempt: Property.Checkbox({
            displayName: 'Best Attempt',
            description: 'Attempt to proceed when awaited events fail or timeout',
            required: false,
            defaultValue: false,
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Custom user agent string',
            required: false,
        }),
        cookies: Property.Array({
            displayName: 'Cookies',
            description: 'Cookies to set before scraping',
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
            }
        }),
        timeout: Property.Number({
            displayName: 'Timeout (ms)',
            description: 'Maximum time to wait for the page to load',
            required: false,
            defaultValue: 30000,
        }),
        waitUntil: Property.StaticDropdown({
            displayName: 'Wait Until',
            description: 'When to consider navigation complete',
            required: false,
            defaultValue: 'networkidle2',
            options: {
                options: [
                    { label: 'Load Event', value: 'load' },
                    { label: 'DOM Content Loaded', value: 'domcontentloaded' },
                    { label: 'Network Idle 0', value: 'networkidle0' },
                    { label: 'Network Idle 2', value: 'networkidle2' }
                ]
            }
        }),
        waitForFunction: Property.LongText({
            displayName: 'Wait for Function',
            description: 'JavaScript function to wait for before scraping (should return true when ready)',
            required: false,
        }),
        viewportWidth: Property.Number({
            displayName: 'Viewport Width',
            description: 'Browser viewport width in pixels',
            required: false,
            defaultValue: 1920,
        }),
        viewportHeight: Property.Number({
            displayName: 'Viewport Height',
            description: 'Browser viewport height in pixels',
            required: false,
            defaultValue: 1080,
        }),
    },
    async run(context) {
        const requestBody: any = {
            url: context.propsValue.url,
            elements: (context.propsValue.elements || []).map((element: any) => {
                let selector = element.selector;
                if (typeof selector === 'string') {
                    try {
                        const parsed = JSON.parse(selector);
                        if (parsed.selector) {
                            selector = parsed.selector;
                        }
                    } catch (e) {
                        console.error('Error parsing selector:', e);
                    }
                } else if (typeof selector === 'object' && selector.selector) {
                    selector = selector.selector;
                }

                const elementConfig: any = {
                    selector: selector,
                };

                if (element.timeout !== undefined) {
                    elementConfig.timeout = element.timeout;
                }

                return elementConfig;
            })
        };

        if (context.propsValue.timeout || context.propsValue.waitUntil) {
            requestBody.gotoOptions = {};
            if (context.propsValue.timeout) {
                requestBody.gotoOptions.timeout = context.propsValue.timeout;
            }
            if (context.propsValue.waitUntil) {
                requestBody.gotoOptions.waitUntil = context.propsValue.waitUntil;
            }
        }

        if (context.propsValue.waitForSelector) {
            const waitForSelectorObj: any = {
                selector: context.propsValue.waitForSelector,
            };

            if (context.propsValue.waitForSelectorTimeout !== undefined) {
                waitForSelectorObj.timeout = context.propsValue.waitForSelectorTimeout;
            }

            if (context.propsValue.waitForSelectorVisible !== undefined) {
                waitForSelectorObj.visible = context.propsValue.waitForSelectorVisible;
            }

            if (context.propsValue.waitForSelectorHidden !== undefined) {
                waitForSelectorObj.hidden = context.propsValue.waitForSelectorHidden;
            }

            requestBody.waitForSelector = waitForSelectorObj;
        }

        if (context.propsValue.waitForTimeout) {
            requestBody.waitForTimeout = context.propsValue.waitForTimeout;
        }

        if (context.propsValue.waitForEvent) {
            const waitForEventObj: any = {
                event: context.propsValue.waitForEvent,
            };

            if (context.propsValue.waitForEventTimeout !== undefined) {
                waitForEventObj.timeout = context.propsValue.waitForEventTimeout;
            }

            requestBody.waitForEvent = waitForEventObj;
        }

        const debugOpts: any = {};
        if (context.propsValue.debugConsole) debugOpts.console = true;
        if (context.propsValue.debugCookies) debugOpts.cookies = true;
        if (context.propsValue.debugNetwork) debugOpts.network = true;

        if (Object.keys(debugOpts).length > 0) {
            requestBody.debugOpts = debugOpts;
        }

        if (context.propsValue.bestAttempt) {
            requestBody.bestAttempt = context.propsValue.bestAttempt;
        }

        if (context.propsValue.waitForFunction) {
            requestBody.waitForFunction = {
                fn: context.propsValue.waitForFunction
            };
        }

        if (context.propsValue.userAgent) {
            requestBody.userAgent = context.propsValue.userAgent;
        }

        if (context.propsValue.viewportWidth && context.propsValue.viewportHeight) {
            requestBody.viewport = {
                width: context.propsValue.viewportWidth,
                height: context.propsValue.viewportHeight,
            };
        }

        if (context.propsValue.cookies && context.propsValue.cookies.length > 0) {
            requestBody.cookies = context.propsValue.cookies.map((cookie: any) => ({
                name: cookie.name,
                value: cookie.value,
                ...(cookie.domain && { domain: cookie.domain })
            }));
        }


        const response = await browserlessCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/scrape',
            body: requestBody,
        });

        return {
            success: true,
            data: response.body,
            metadata: {
                url: context.propsValue.url,
                elementsCount: (context.propsValue.elements || []).length,
                timestamp: new Date().toISOString(),
            }
        };
    },
});
