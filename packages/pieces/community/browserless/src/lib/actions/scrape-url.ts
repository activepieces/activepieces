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
            description: 'CSS selectors and names for elements to extract',
            required: true,
            properties: {
                selector: Property.ShortText({
                    displayName: 'CSS Selector',
                    description: 'CSS selector for the element',
                    required: true,
                }),
                name: Property.ShortText({
                    displayName: 'Field Name',
                    description: 'Name for this field in the output',
                    required: true,
                }),
                attribute: Property.ShortText({
                    displayName: 'Attribute',
                    description: 'HTML attribute to extract (leave empty for text content)',
                    required: false,
                }),
                multiple: Property.Checkbox({
                    displayName: 'Multiple Elements',
                    description: 'Extract all matching elements (returns array)',
                    required: false,
                    defaultValue: false,
                }),
            }
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before scraping',
            required: false,
        }),
        delay: Property.Number({
            displayName: 'Delay (ms)',
            description: 'Delay in milliseconds before scraping',
            required: false,
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
                const elementConfig: any = {
                    selector: element.selector,
                    name: element.name,
                };
                
                if (element.attribute) {
                    elementConfig.attribute = element.attribute;
                }
                
                if (element.multiple) {
                    elementConfig.multiple = element.multiple;
                }
                
                return elementConfig;
            })
        };

        const gotoOptions: any = {};
        const waitFor: any = {};
        const options: any = {};

        if (context.propsValue.timeout) {
            gotoOptions.timeout = context.propsValue.timeout;
        }

        if (context.propsValue.waitUntil) {
            gotoOptions.waitUntil = context.propsValue.waitUntil;
        }

        if (context.propsValue.waitForSelector) {
            waitFor.waitForSelector = { selector: context.propsValue.waitForSelector };
        }

        if (context.propsValue.delay) {
            waitFor.waitForTimeout = { timeout: context.propsValue.delay };
        }

        if (context.propsValue.waitForFunction) {
            waitFor.waitForFunction = { fn: context.propsValue.waitForFunction };
        }

        if (context.propsValue.userAgent) {
            options.userAgent = context.propsValue.userAgent;
        }

        if (context.propsValue.viewportWidth && context.propsValue.viewportHeight) {
            options.viewport = {
                width: context.propsValue.viewportWidth,
                height: context.propsValue.viewportHeight,
            };
        }

        if (context.propsValue.cookies && context.propsValue.cookies.length > 0) {
            options.cookies = context.propsValue.cookies.map((cookie: any) => ({
                name: cookie.name,
                value: cookie.value,
                ...(cookie.domain && { domain: cookie.domain })
            }));
        }

        if (Object.keys(gotoOptions).length > 0) {
            requestBody.gotoOptions = gotoOptions;
        }

        if (Object.keys(waitFor).length > 0) {
            requestBody.waitFor = waitFor;
        }

        if (Object.keys(options).length > 0) {
            requestBody.options = options;
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
