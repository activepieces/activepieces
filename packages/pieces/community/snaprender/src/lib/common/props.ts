import { Property } from '@activepieces/pieces-framework';

export const snaprenderProps = {
    url: ({ description }: { description: string }) =>
        Property.ShortText({
            displayName: 'Page URL',
            description,
            required: true,
            placeholder: 'https://example.com',
        }),
    imageFormat: ({ includePdf, description }: { includePdf: boolean; description: string }) =>
        Property.StaticDropdown({
            displayName: 'Format',
            description,
            required: true,
            defaultValue: 'png',
            options: {
                options: [
                    { label: 'PNG', value: 'png' },
                    { label: 'JPEG', value: 'jpeg' },
                    { label: 'WebP', value: 'webp' },
                    ...(includePdf ? [{ label: 'PDF', value: 'pdf' }] : []),
                ],
            },
        }),
    fullPage: ({ defaultValue }: { defaultValue: boolean }) =>
        Property.Checkbox({
            displayName: 'Full Page',
            description: 'Capture the whole scrollable page instead of only the visible window.',
            required: false,
            defaultValue,
        }),
    device: () =>
        Property.StaticDropdown({
            displayName: 'Device',
            description: 'Render the page as a phone, tablet or laptop would show it. A device sets its own screen size, so Width and Height are then ignored.',
            required: false,
            defaultValue: DESKTOP,
            options: {
                options: [
                    { label: 'Desktop (uses Width and Height)', value: DESKTOP },
                    { label: 'iPhone 14', value: 'iphone_14' },
                    { label: 'iPhone 15 Pro', value: 'iphone_15_pro' },
                    { label: 'Pixel 7', value: 'pixel_7' },
                    { label: 'iPad Pro', value: 'ipad_pro' },
                    { label: 'MacBook Pro', value: 'macbook_pro' },
                ],
            },
        }),
    darkMode: () =>
        Property.Checkbox({
            displayName: 'Dark Mode',
            description: 'Ask the page for its dark theme. Only pages that support a dark theme change.',
            required: false,
            defaultValue: false,
        }),
    blockAds: () =>
        Property.Checkbox({
            displayName: 'Block Ads',
            description: 'Block ads and trackers before the capture.',
            required: false,
            defaultValue: true,
        }),
    blockCookieBanners: () =>
        Property.Checkbox({
            displayName: 'Hide Cookie Banners',
            description: 'Remove cookie consent banners and similar overlays before the capture.',
            required: false,
            defaultValue: true,
        }),
    width: () =>
        Property.Number({
            displayName: 'Width (px)',
            description: 'Browser window width, 320 to 3840. Default 1280.',
            required: false,
            advanced: true,
        }),
    height: () =>
        Property.Number({
            displayName: 'Height (px)',
            description: 'Browser window height, 200 to 10000. Default 800. With Full Page on, the capture can be taller.',
            required: false,
            advanced: true,
        }),
    delay: () =>
        Property.Number({
            displayName: 'Delay (ms)',
            description: 'Extra wait after the page loads, 0 to 10000 milliseconds. Helps with animations and content that loads late.',
            required: false,
            advanced: true,
        }),
    quality: ({ description }: { description: string }) =>
        Property.Number({
            displayName: 'Quality',
            description,
            required: false,
            advanced: true,
        }),
    hideSelectors: () =>
        Property.ShortText({
            displayName: 'Hide Elements',
            description: 'CSS selectors of elements to hide before the capture, separated by commas.',
            required: false,
            placeholder: '.chat-widget, #promo-bar',
            advanced: true,
        }),
    clickSelector: () =>
        Property.ShortText({
            displayName: 'Click Element',
            description: 'CSS selector of an element to click before the capture, for example a "Show more" button or a dialog close button.',
            required: false,
            placeholder: 'button.accept',
            advanced: true,
        }),
    userAgent: () =>
        Property.ShortText({
            displayName: 'User Agent',
            description: 'Send a custom User-Agent header to the page. Leave empty for the default browser.',
            required: false,
            advanced: true,
        }),
    useCache: () =>
        Property.Checkbox({
            displayName: 'Reuse Recent Capture',
            description: 'Return a stored copy when the same capture was made recently. A stored copy does not use a capture from your monthly quota. Off by default, so every run renders the page again.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
    cacheTtl: () =>
        Property.Number({
            displayName: 'Maximum Copy Age (seconds)',
            description: 'With Reuse Recent Capture on: how old a stored copy may be. Default 86400 (one day). The longest age allowed depends on your plan.',
            required: false,
            advanced: true,
        }),
    embedDetails: () =>
        Property.Checkbox({
            displayName: 'Embed Capture Details',
            description: 'Keep the page address and the name SnapRender inside the file (PNG text fields, JPEG comment, PDF properties). Turn off for a file without these details.',
            required: false,
            defaultValue: true,
            advanced: true,
        }),
    fileName: ({ placeholder }: { placeholder: string }) =>
        Property.ShortText({
            displayName: 'File Name',
            description: 'Name of the output file without the extension. Leave empty for an automatic name.',
            required: false,
            placeholder,
            advanced: true,
        }),
};

export const snaprenderBody = {
    renderOptions,
    cacheOptions,
    nonEmpty,
    fileName,
    pageUrl,
    format,
    optionalNumber,
};

function renderOptions(values: RenderOptionValues): Record<string, string | number | boolean> {
    const width = optionalNumber({ value: values.width, label: 'Width', min: 320, max: 3840 });
    const height = optionalNumber({ value: values.height, label: 'Height', min: 200, max: 10000 });
    const delay = optionalNumber({ value: values.delay, label: 'Delay', min: 0, max: 10000 });
    const quality = optionalNumber({ value: values.quality, label: 'Quality', min: 1, max: 100 });
    const device = nonEmpty(values.device) && values.device !== DESKTOP ? values.device.trim() : undefined;
    return {
        full_page: values.fullPage === true,
        dark_mode: values.darkMode === true,
        block_ads: values.blockAds !== false,
        block_cookie_banners: values.blockCookieBanners !== false,
        ...(device !== undefined ? { device } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...(delay !== undefined ? { delay } : {}),
        ...(quality !== undefined ? { quality } : {}),
        ...(nonEmpty(values.hideSelectors) ? { hide_selectors: values.hideSelectors.trim() } : {}),
        ...(nonEmpty(values.clickSelector) ? { click_selector: values.clickSelector.trim() } : {}),
        ...(nonEmpty(values.userAgent) ? { user_agent: values.userAgent.trim() } : {}),
    };
}

function cacheOptions({ useCache, cacheTtl }: { useCache?: boolean | null; cacheTtl?: number | null }): Record<string, unknown> {
    if (useCache !== true) {
        return {};
    }
    const ttl = optionalNumber({ value: cacheTtl, label: 'Maximum Copy Age', min: 0, max: 2592000 });
    return { cache: true, ...(ttl !== undefined ? { cache_ttl: ttl } : {}) };
}

function nonEmpty(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

function fileName({ requested, fallback, extension }: { requested?: string | null; fallback: string; extension: string }): string {
    const base = nonEmpty(requested) ? requested.trim().replace(/\.(png|jpe?g|webp|pdf)$/i, '') : fallback;
    const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
    return `${safe === '' ? fallback : safe}.${extension}`;
}

function pageUrl({ value, label }: { value: string | null | undefined; label: string }): string {
    if (!nonEmpty(value)) {
        throw new Error(`${label} is required.`);
    }
    const trimmed = value.trim();
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function format<T extends string>({ value, allowed }: { value: string | null | undefined; allowed: readonly T[] }): T {
    const match = allowed.find((option) => option === (value ?? '').trim().toLowerCase());
    if (match === undefined) {
        throw new Error(`Format must be one of: ${allowed.join(', ')}.`);
    }
    return match;
}

function optionalNumber({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`${label} must be a whole number.`);
    }
    if (parsed < min || parsed > max) {
        throw new Error(`${label} must be between ${min} and ${max}.`);
    }
    return parsed;
}

const DESKTOP = 'desktop';

export const IMAGE_FORMATS = ['png', 'jpeg', 'webp'] as const;

export const ALL_FORMATS = ['png', 'jpeg', 'webp', 'pdf'] as const;

export type RenderOptionValues = {
    fullPage?: boolean | null;
    darkMode?: boolean | null;
    blockAds?: boolean | null;
    blockCookieBanners?: boolean | null;
    device?: string | null;
    width?: number | null;
    height?: number | null;
    delay?: number | null;
    quality?: number | null;
    hideSelectors?: string | null;
    clickSelector?: string | null;
    userAgent?: string | null;
};
