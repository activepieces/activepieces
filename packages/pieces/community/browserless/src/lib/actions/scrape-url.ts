import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_WAIT_UNTIL = 'networkidle2';
const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

export const scrapeUrl = createAction({
    name: 'scrape_url',
    classification: 'READ',
    displayName: 'Scrape URL',
    description: 'Read the text and HTML of chosen elements on a web page.',
    audience: 'both',
    aiMetadata: { description: 'Loads a web page in a headless browser and extracts the elements matched by the CSS selectors you supply. Use when you know which CSS selectors hold the data; for a whole page as markdown or text use Smart Scrape, for raw HTML use Get Page Content. The page URL and at least one selector are required. Read-only and safe to retry.', idempotent: true },
    auth: browserlessAuth,
    propertyGroups: [
        {
            key: 'page',
            display: 'section',
            label: 'Page',
            icon: 'send',
            props: ['url', 'waitUntil', 'timeout'],
        },
        {
            key: 'elements',
            display: 'section',
            label: 'Elements',
            icon: 'tag',
            props: ['elements'],
        },
        {
            key: 'browser',
            display: 'section',
            label: 'Browser',
            icon: 'user',
            props: ['viewportWidth', 'viewportHeight', 'userAgent', 'cookies'],
        },
        {
            key: 'wait',
            display: 'section',
            label: 'Wait for the page',
            icon: 'calendar',
            props: ['waitForSelector', 'waitForTimeout'],
        },
    ],
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The page to scrape.',
            placeholder: 'https://example.com',
            required: true,
        }),
        elements: Property.Array({
            displayName: 'Elements to Extract',
            description: 'CSS selectors of the elements to read.',
            required: true,
            properties: {
                selector: Property.ShortText({
                    displayName: 'CSS Selector',
                    description: 'CSS selector of one element.',
                    placeholder: 'h1',
                    required: true,
                }),
                timeout: Property.Number({
                    displayName: 'Element Timeout',
                    description: 'Milliseconds to wait for this element.',
                    required: false,
                }),
            }
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before scraping.',
            placeholder: '#content',
            required: false,
        }),
        waitForSelectorTimeout: Property.Number({
            displayName: 'Selector Timeout',
            description: 'Milliseconds to wait for the selector.',
            required: false,
            advanced: true,
        }),
        waitForSelectorVisible: Property.Checkbox({
            displayName: 'Selector Must Be Visible',
            description: 'Wait until the selector is visible.',
            required: false,
            defaultValue: true,
            advanced: true,
        }),
        waitForSelectorHidden: Property.Checkbox({
            displayName: 'Selector Must Be Hidden',
            description: 'Wait until the selector is hidden instead.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        waitForTimeout: Property.Number({
            displayName: 'Extra Wait',
            description: 'Milliseconds to wait after the page loads, for late content.',
            required: false,
        }),
        waitForEvent: Property.ShortText({
            displayName: 'Wait for Event',
            description: 'Page event to wait for before scraping.',
            required: false,
            advanced: true,
        }),
        waitForEventTimeout: Property.Number({
            displayName: 'Event Timeout',
            description: 'Milliseconds to wait for the event.',
            required: false,
            advanced: true,
        }),
        debugConsole: Property.Checkbox({
            displayName: 'Include Console Logs',
            description: "Add the page's console messages to the output.",
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        debugCookies: Property.Checkbox({
            displayName: 'Include Cookies',
            description: "Add the page's cookies to the output.",
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        debugNetwork: Property.Checkbox({
            displayName: 'Include Network Requests',
            description: "Add the page's network requests to the output.",
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        bestAttempt: Property.Checkbox({
            displayName: 'Best Attempt',
            description: 'Use what has loaded when a wait times out, instead of failing.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Browser user agent string to send instead of the default.',
            required: false,
        }),
        cookies: Property.Array({
            displayName: 'Cookies',
            description: 'Cookies to set before the page loads.',
            required: false,
            properties: {
                name: Property.ShortText({
                    displayName: 'Cookie Name',
                    description: 'Cookie name.',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Cookie Value',
                    description: 'Cookie value.',
                    required: true,
                }),
                domain: Property.ShortText({
                    displayName: 'Domain',
                    description: "Domain the cookie belongs to. Empty: the page's domain.",
                    required: false,
                }),
            }
        }),
        timeout: Property.Number({
            displayName: 'Page Load Timeout',
            description: 'Milliseconds to wait for the page to load.',
            required: false,
            defaultValue: DEFAULT_TIMEOUT_MS,
        }),
        waitUntil: Property.StaticDropdown({
            displayName: 'Wait Until',
            description: 'When the page counts as loaded.',
            required: false,
            defaultValue: DEFAULT_WAIT_UNTIL,
            options: {
                options: [
                    { label: 'Load Event', value: 'load' },
                    { label: 'DOM Content Loaded', value: 'domcontentloaded' },
                    { label: 'Network Idle (0 connections)', value: 'networkidle0' },
                    { label: 'Network Idle (2 connections)', value: 'networkidle2' }
                ]
            }
        }),
        waitForFunction: Property.LongText({
            displayName: 'Wait for Function',
            description: 'JavaScript that returns true when the page is ready.',
            required: false,
            advanced: true,
        }),
        viewportWidth: Property.Number({
            displayName: 'Viewport Width',
            description: 'Pixels.',
            required: false,
            defaultValue: DEFAULT_VIEWPORT.width,
            width: 'half',
        }),
        viewportHeight: Property.Number({
            displayName: 'Viewport Height',
            description: 'Pixels.',
            required: false,
            defaultValue: DEFAULT_VIEWPORT.height,
            width: 'half',
        }),
    },
    outputSchema: browserlessOutputSchemas.scrapeUrl,
    async run(context) {
        const props = context.propsValue;
        const elements = (props.elements ?? []).map(browserlessValues.record).map((element, index) => {
            const selector = readSelector(element['selector']);
            if (selector === '') {
                throw new Error(`Element ${index + 1} needs a CSS selector.`);
            }
            const timeout = browserlessBody.optionalNumber({ value: element['timeout'], label: `Element ${index + 1} timeout`, min: 0 });
            return { selector, ...(timeout !== undefined ? { timeout } : {}) };
        });
        if (elements.length === 0) {
            throw new Error('Add at least one CSS selector under Elements to Extract.');
        }

        const navigationTimeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Page Load Timeout', min: 0 }) ?? DEFAULT_TIMEOUT_MS;
        const selectorTimeout = browserlessBody.optionalNumber({ value: props.waitForSelectorTimeout, label: 'Selector Timeout', min: 0 });
        const eventTimeout = browserlessBody.optionalNumber({ value: props.waitForEventTimeout, label: 'Event Timeout', min: 0 });
        const waitForTimeout = browserlessBody.optionalNumber({ value: props.waitForTimeout, label: 'Extra Wait', min: 0 });
        const viewportWidth = browserlessBody.optionalNumber({ value: props.viewportWidth, label: 'Viewport Width', min: 1 }) ?? DEFAULT_VIEWPORT.width;
        const viewportHeight = browserlessBody.optionalNumber({ value: props.viewportHeight, label: 'Viewport Height', min: 1 }) ?? DEFAULT_VIEWPORT.height;

        const gotoOptions = {
            timeout: navigationTimeout,
            waitUntil: browserlessBody.nonEmpty(props.waitUntil) ? props.waitUntil : DEFAULT_WAIT_UNTIL,
        };
        const debugOpts = {
            ...(props.debugConsole === true ? { console: true } : {}),
            ...(props.debugCookies === true ? { cookies: true } : {}),
            ...(props.debugNetwork === true ? { network: true } : {}),
        };
        const cookies = (props.cookies ?? [])
            .map(browserlessValues.record)
            .map((cookie) => ({
                name: String(cookie['name'] ?? '').trim(),
                value: String(cookie['value'] ?? ''),
                domain: String(cookie['domain'] ?? '').trim(),
            }))
            .filter((cookie) => cookie.name !== '')
            .map((cookie) => ({
                name: cookie.name,
                value: cookie.value,
                ...(cookie.domain !== '' ? { domain: cookie.domain } : { url: props.url }),
            }));

        const requestBody = {
            url: props.url,
            elements,
            gotoOptions,
            ...(browserlessBody.nonEmpty(props.waitForSelector)
                ? {
                      waitForSelector: {
                          selector: props.waitForSelector.trim(),
                          ...(selectorTimeout !== undefined ? { timeout: selectorTimeout } : {}),
                          ...(props.waitForSelectorHidden === true ? { hidden: true } : props.waitForSelectorVisible !== false ? { visible: true } : {}),
                      },
                  }
                : {}),
            ...(waitForTimeout !== undefined ? { waitForTimeout } : {}),
            ...(browserlessBody.nonEmpty(props.waitForEvent)
                ? { waitForEvent: { event: props.waitForEvent.trim(), ...(eventTimeout !== undefined ? { timeout: eventTimeout } : {}) } }
                : {}),
            ...(Object.keys(debugOpts).length > 0 ? { debugOpts } : {}),
            ...(props.bestAttempt === true ? { bestAttempt: true } : {}),
            ...(browserlessBody.nonEmpty(props.waitForFunction) ? { waitForFunction: { fn: props.waitForFunction } } : {}),
            ...(browserlessBody.nonEmpty(props.userAgent) ? { userAgent: { userAgent: props.userAgent.trim() } } : {}),
            viewport: { width: viewportWidth, height: viewportHeight },
            ...(cookies.length > 0 ? { cookies } : {}),
        };

        const response = await browserlessApi.request({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/scrape',
            body: requestBody,
            operation: 'Scrape URL',
        });

        return {
            success: true,
            data: response.body,
            metadata: {
                url: props.url,
                elementsCount: elements.length,
                timestamp: new Date().toISOString(),
                ...browserlessApi.siteResponse(response.headers),
            },
        };
    },
});

function readSelector(value: unknown): string {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.startsWith('{') ? readSelector(parseJsonObject(trimmed)) || trimmed : trimmed;
    }
    if (typeof value === 'object' && value !== null && 'selector' in value && typeof value.selector === 'string') {
        return value.selector.trim();
    }
    return '';
}

function parseJsonObject(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
