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
    description: 'Extract content from a web page',
    audience: 'both',
    aiMetadata: { description: 'Loads a web page in a headless browser and extracts the elements matched by the CSS selectors you supply. Use when you know which CSS selectors hold the data; for a whole page as markdown or text use Smart Scrape, for raw HTML use Get Page Content. The page URL and at least one selector are required. Read-only and safe to retry.', idempotent: true },
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
            defaultValue: DEFAULT_TIMEOUT_MS,
        }),
        waitUntil: Property.StaticDropdown({
            displayName: 'Wait Until',
            description: 'When to consider navigation complete',
            required: false,
            defaultValue: DEFAULT_WAIT_UNTIL,
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
            defaultValue: DEFAULT_VIEWPORT.width,
        }),
        viewportHeight: Property.Number({
            displayName: 'Viewport Height',
            description: 'Browser viewport height in pixels',
            required: false,
            defaultValue: DEFAULT_VIEWPORT.height,
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

        const navigationTimeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 0 }) ?? DEFAULT_TIMEOUT_MS;
        const selectorTimeout = browserlessBody.optionalNumber({ value: props.waitForSelectorTimeout, label: 'Wait for Selector Timeout', min: 0 });
        const eventTimeout = browserlessBody.optionalNumber({ value: props.waitForEventTimeout, label: 'Wait for Event Timeout', min: 0 });
        const waitForTimeout = browserlessBody.optionalNumber({ value: props.waitForTimeout, label: 'Wait Timeout', min: 0 });
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
