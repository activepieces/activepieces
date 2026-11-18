import { Property } from '@activepieces/pieces-framework';

export const browserlessProps = {
    url: ({ required, description }: { required: boolean; description: string }) =>
        Property.ShortText({
            displayName: 'URL',
            description,
            required,
        }),
    waitUntil: () =>
        Property.StaticDropdown({
            displayName: 'Wait Until',
            description: 'When the page counts as loaded. "Network Idle" waits longest and suits pages that load data with JavaScript.',
            required: false,
            options: {
                options: [
                    { label: 'Load Event', value: 'load' },
                    { label: 'DOM Content Loaded', value: 'domcontentloaded' },
                    { label: 'Network Idle (0 connections)', value: 'networkidle0' },
                    { label: 'Network Idle (2 connections)', value: 'networkidle2' },
                ],
            },
        }),
    navigationTimeout: () =>
        Property.Number({
            displayName: 'Page Load Timeout (ms)',
            description: 'How long to wait for the page to load before failing (Browserless default 30000).',
            required: false,
        }),
    waitForSelector: () =>
        Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'A CSS selector (for example `#content` or `.price`) to wait for before reading the page.',
            required: false,
        }),
    waitForTimeout: () =>
        Property.Number({
            displayName: 'Extra Wait (ms)',
            description: 'Extra time to wait after the page loads, for animations or late content.',
            required: false,
        }),
    bestAttempt: () =>
        Property.Checkbox({
            displayName: 'Best Attempt',
            description: 'Continue with whatever has loaded when a wait or the page load times out, instead of failing.',
            required: false,
            defaultValue: false,
        }),
    blockAds: () =>
        Property.Checkbox({
            displayName: 'Block Ads',
            description: 'Load the page with an ad blocker, which is usually faster.',
            required: false,
            defaultValue: false,
        }),
    proxy: ({ description }: { description: string }) =>
        Property.StaticDropdown({
            displayName: 'Proxy',
            description,
            required: false,
            options: {
                options: [
                    { label: 'Datacenter (2 units/MB)', value: 'datacenter' },
                    { label: 'Residential (6 units/MB)', value: 'residential' },
                ],
            },
        }),
    maxCharacters: () =>
        Property.Number({
            displayName: 'Maximum Characters',
            description: 'Cut long text fields to this many characters (default 100000, 0 = no limit).',
            required: false,
            defaultValue: DEFAULT_MAX_CHARACTERS,
        }),
    sessionTimeout: () =>
        Property.Number({
            displayName: 'Timeout (ms)',
            description: 'Maximum time the whole request may take on Browserless. Browser time is billed per 30 seconds, so a lower limit caps cost. Keep it under 540000.',
            required: false,
        }),
};

export const browserlessBody = {
    pageOptions,
    optionalNumber,
    nonEmpty,
    textList,
    httpUrl,
    maxCharacters,
    cap,
    pageSource,
};

function pageOptions({
    waitUntil,
    navigationTimeout,
    waitForSelector,
    waitForTimeout,
    bestAttempt,
}: {
    waitUntil?: string | null;
    navigationTimeout?: number | null;
    waitForSelector?: string | null;
    waitForTimeout?: number | null;
    bestAttempt?: boolean | null;
}): Record<string, unknown> {
    const gotoOptions = {
        ...(nonEmpty(waitUntil) ? { waitUntil } : {}),
        ...(optionalNumber({ value: navigationTimeout, label: 'Page Load Timeout', min: 0 }) !== undefined ? { timeout: Number(navigationTimeout) } : {}),
    };
    const extraWait = optionalNumber({ value: waitForTimeout, label: 'Extra Wait', min: 0 });
    return {
        ...(Object.keys(gotoOptions).length > 0 ? { gotoOptions } : {}),
        ...(nonEmpty(waitForSelector) ? { waitForSelector: { selector: waitForSelector.trim() } } : {}),
        ...(extraWait !== undefined ? { waitForTimeout: extraWait } : {}),
        ...(bestAttempt === true ? { bestAttempt: true } : {}),
    };
}

function optionalNumber({ value, label, min, max }: { value: unknown; label: string; min?: number; max?: number }): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`${label} must be a number.`);
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`${label} must be at least ${min}.`);
    }
    if (max !== undefined && parsed > max) {
        throw new Error(`${label} must be at most ${max}.`);
    }
    return parsed;
}

function maxCharacters(value: unknown): number {
    const parsed = optionalNumber({ value, label: 'Maximum Characters', min: 0 });
    return parsed === undefined ? DEFAULT_MAX_CHARACTERS : Math.floor(parsed);
}

function cap({ text, max }: { text: string | null; max: number }): { text: string | null; truncated: boolean } {
    if (text === null || max === 0 || text.length <= max) {
        return { text, truncated: false };
    }
    return { text: text.slice(0, max), truncated: true };
}

function pageSource({ url, html }: { url: unknown; html: unknown }): { url: string } | { html: string } {
    const hasUrl = typeof url === 'string' && url.trim() !== '';
    const hasHtml = typeof html === 'string' && html.trim() !== '';
    if (hasUrl === hasHtml) {
        throw new Error('Provide exactly one of URL or HTML.');
    }
    return hasUrl ? { url: httpUrl({ value: url, label: 'URL' }) } : { html: String(html) };
}

function httpUrl({ value, label }: { value: unknown; label: string }): string {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!/^https?:\/\/[^\s/]+\S*$/i.test(trimmed)) {
        throw new Error(`${label} must be a full web address starting with http:// or https://`);
    }
    return trimmed;
}

function nonEmpty(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

function textList(value: unknown): string[] {
    if (value === undefined || value === null) {
        return [];
    }
    const items = Array.isArray(value) ? value : [value];
    return items
        .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
        .filter((item) => item !== '');
}

const DEFAULT_MAX_CHARACTERS = 100_000;
