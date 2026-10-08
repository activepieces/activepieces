import { browserlessValues } from './values';

export const browserlessLighthouse = {
    buildSettings,
    summarize,
    DEFAULT_CATEGORIES: ['performance', 'accessibility', 'best-practices', 'seo'],
};

function buildSettings({
    device,
    onlyCategories,
    throttling,
    locale,
    userAgent,
    timeout,
}: {
    device: 'desktop' | 'mobile';
    onlyCategories?: string[];
    throttling?: string | null;
    locale?: string | null;
    userAgent?: string | null;
    timeout?: number;
}): Record<string, unknown> {
    const preset = throttling ? THROTTLING[throttling] : undefined;
    return {
        formFactor: device,
        screenEmulation: SCREEN_EMULATION[device],
        ...(onlyCategories ? { onlyCategories } : {}),
        ...(typeof locale === 'string' && locale.trim() !== '' ? { locale: locale.trim() } : {}),
        ...(throttling === 'none' ? { throttlingMethod: 'provided' } : {}),
        ...(preset ? { throttlingMethod: 'simulate', throttling: preset } : {}),
        ...(typeof userAgent === 'string' && userAgent.trim() !== '' ? { emulatedUserAgent: userAgent.trim() } : {}),
        ...(timeout !== undefined ? { maxWaitForLoad: timeout } : {}),
    };
}

function summarize({ body, url, device }: { body: unknown; url: string; device: string }) {
    const lhr = readLighthouseResult(body);
    const categories = browserlessValues.record(lhr['categories']);
    const audits = browserlessValues.record(lhr['audits']);
    const runtimeError = browserlessValues.record(lhr['runtimeError']);
    return {
        lighthouseVersion: stringOr({ value: lhr['lighthouseVersion'], fallback: 'unknown' }),
        summary: {
            url,
            finalUrl: typeof lhr['finalDisplayedUrl'] === 'string' ? lhr['finalDisplayedUrl'] : typeof lhr['finalUrl'] === 'string' ? lhr['finalUrl'] : null,
            formFactor: device,
            timestamp: new Date().toISOString(),
            scores: {
                performance: categoryScore({ categories, id: 'performance' }),
                accessibility: categoryScore({ categories, id: 'accessibility' }),
                bestPractices: categoryScore({ categories, id: 'best-practices' }),
                seo: categoryScore({ categories, id: 'seo' }),
                pwa: categoryScore({ categories, id: 'pwa' }),
            },
            metrics: {
                firstContentfulPaint: auditMetric({ audits, id: 'first-contentful-paint' }),
                largestContentfulPaint: auditMetric({ audits, id: 'largest-contentful-paint' }),
                firstMeaningfulPaint: auditMetric({ audits, id: 'first-meaningful-paint' }),
                speedIndex: auditMetric({ audits, id: 'speed-index' }),
                timeToInteractive: auditMetric({ audits, id: 'interactive' }),
                totalBlockingTime: auditMetric({ audits, id: 'total-blocking-time' }),
                cumulativeLayoutShift: auditMetric({ audits, id: 'cumulative-layout-shift' }),
            },
            opportunities: OPPORTUNITIES.filter((item) => hasItems(browserlessValues.record(audits[item.audit]))).map((item) => ({
                type: item.type,
                title: item.title,
                potentialSavings: stringOr({ value: browserlessValues.record(audits[item.audit])['displayValue'], fallback: 'Unknown' }),
            })),
            runtimeError: typeof runtimeError['message'] === 'string' ? runtimeError['message'] : null,
        },
    };
}

function readLighthouseResult(body: unknown): Record<string, unknown> {
    const root = browserlessValues.record(body);
    const data = browserlessValues.record(root['data']);
    const candidates = [browserlessValues.record(root['lhr']), browserlessValues.record(data['lhr']), data, root];
    return candidates.find((candidate) => 'categories' in candidate || 'audits' in candidate) ?? {};
}

function toPercent(score: unknown): number | null {
    return typeof score === 'number' && Number.isFinite(score) ? Math.round(score * 100) : null;
}

function categoryScore({ categories, id }: { categories: Record<string, unknown>; id: string }): number | null {
    return toPercent(browserlessValues.record(categories[id])['score']);
}

function auditMetric({ audits, id }: { audits: Record<string, unknown>; id: string }) {
    const audit = browserlessValues.record(audits[id]);
    return {
        value: typeof audit['displayValue'] === 'string' ? audit['displayValue'] : null,
        numericValue: typeof audit['numericValue'] === 'number' ? audit['numericValue'] : null,
        score: toPercent(audit['score']),
    };
}

function hasItems(audit: Record<string, unknown>): boolean {
    const items = browserlessValues.record(audit['details'])['items'];
    return Array.isArray(items) && items.length > 0;
}

function stringOr({ value, fallback }: { value: unknown; fallback: string }): string {
    return typeof value === 'string' && value !== '' ? value : fallback;
}

const THROTTLING: Record<string, { rttMs: number; throughputKbps: number; cpuSlowdownMultiplier: number }> = {
    mobileSlow4G: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    mobileRegular4G: { rttMs: 100, throughputKbps: 2048, cpuSlowdownMultiplier: 3 },
    mobileFast4G: { rttMs: 50, throughputKbps: 4096, cpuSlowdownMultiplier: 2 },
};

const SCREEN_EMULATION = {
    desktop: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    mobile: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
};

const OPPORTUNITIES = [
    { audit: 'unused-css-rules', type: 'unused-css', title: 'Remove unused CSS' },
    { audit: 'unused-javascript', type: 'unused-javascript', title: 'Remove unused JavaScript' },
    { audit: 'render-blocking-resources', type: 'render-blocking', title: 'Eliminate render-blocking resources' },
];
