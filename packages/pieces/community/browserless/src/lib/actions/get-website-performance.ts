import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessApi } from '../common/client';
import { browserlessBody } from '../common/props';
import { browserlessLighthouse } from '../common/lighthouse';
import { browserlessValues } from '../common/values';
import { browserlessOutputSchemas } from '../output-schemas';

export const getWebsitePerformance = createAction({
    name: 'get_website_performance',
    classification: 'READ',
    displayName: 'Get Website Performance',
    description: 'Score a page\'s performance, accessibility and SEO with Lighthouse.',
    propertyGroups: [
        { key: 'audit', display: 'section', label: 'Audit', icon: 'send', props: ['url', 'categories', 'onlyCategories', 'includeFullReport'] },
        { key: 'device', display: 'section', label: 'Device', icon: 'sliders', props: ['device', 'throttling', 'locale', 'timeout'] },
        { key: 'budgets', display: 'section', label: 'Resource limits', icon: 'tag', props: ['budgets'] },
    ],
    audience: 'human',
    aiMetadata: { description: 'Runs a Lighthouse audit on a public URL in a headless browser and returns performance, accessibility, best-practices and SEO scores (0-100) plus Core Web Vitals. Use to measure a page\'s quality; the URL is required, and you can scope the audit to specific categories and simulate a desktop or mobile device with network throttling. Read-only analysis: re-running with the same input re-audits the page without side effects (scores may vary slightly run to run).', idempotent: true },
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The page to audit.',
            placeholder: 'https://example.com',
            required: true,
        }),
        categories: Property.Array({
            displayName: 'Categories',
            description: 'Categories to score. Empty: all. PWA has no score on Lighthouse 12.',
            required: false,
            properties: {
                category: Property.StaticDropdown({
                    displayName: 'Category',
                    required: true,
                    options: {
                        options: [
                            { label: 'Performance', value: 'performance' },
                            { label: 'Accessibility', value: 'accessibility' },
                            { label: 'Best Practices', value: 'best-practices' },
                            { label: 'SEO', value: 'seo' },
                            { label: 'PWA', value: 'pwa' }
                        ]
                    }
                })
            }
        }),
        device: Property.StaticDropdown({
            displayName: 'Device Type',
            description: 'Which device Lighthouse emulates.',
            display: 'cards',
            required: false,
            defaultValue: 'desktop',
            options: {
                options: [
                    { label: 'Desktop', value: 'desktop' },
                    { label: 'Mobile', value: 'mobile' }
                ]
            }
        }),
        throttling: Property.StaticDropdown({
            displayName: 'Network Throttling',
            description: 'Simulated network speed during the audit.',
            display: 'cards',
            required: false,
            defaultValue: 'mobileSlow4G',
            options: {
                options: [
                    { label: 'No Throttling', value: 'none' },
                    { label: 'Slow 4G', value: 'mobileSlow4G' },
                    { label: 'Regular 4G', value: 'mobileRegular4G' },
                    { label: 'Fast 4G', value: 'mobileFast4G' }
                ]
            }
        }),
        onlyCategories: Property.Checkbox({
            displayName: 'Only Category Scores',
            description: 'With no categories picked, score only the four main ones.',
            required: false,
            defaultValue: false,
        }),
        locale: Property.ShortText({
            displayName: 'Locale',
            description: 'Language of the report text.',
            placeholder: 'en-US',
            required: false,
            defaultValue: 'en-US',
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Browser user agent string to send instead of the default.',
            required: false,
            advanced: true,
        }),
        timeout: Property.Number({
            displayName: 'Page Load Timeout',
            description: 'Milliseconds to wait for the page to load during the audit.',
            required: false,
            defaultValue: 60000,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'Not used: Lighthouse audits ignore this setting.',
            required: false,
            advanced: true,
        }),
        emulateMediaType: Property.StaticDropdown({
            displayName: 'Emulate Media Type',
            description: 'Not used: Lighthouse audits ignore this setting.',
            required: false,
            advanced: true,
            options: {
                options: [
                    { label: 'Screen', value: 'screen' },
                    { label: 'Print', value: 'print' }
                ]
            }
        }),
        budgets: Property.Array({
            displayName: 'Performance Budgets',
            description: 'Maximum sizes per resource type; the report flags overruns.',
            required: false,
            properties: {
                resourceType: Property.StaticDropdown({
                    displayName: 'Resource Type',
                    description: 'Type of resource to budget',
                    required: true,
                    options: {
                        options: [
                            { label: 'Document', value: 'document' },
                            { label: 'Script', value: 'script' },
                            { label: 'Stylesheet', value: 'stylesheet' },
                            { label: 'Image', value: 'image' },
                            { label: 'Media', value: 'media' },
                            { label: 'Font', value: 'font' },
                            { label: 'Other', value: 'other' },
                            { label: 'Third-party', value: 'third-party' }
                        ]
                    }
                }),
                budget: Property.Number({
                    displayName: 'Budget Size',
                    description: 'Maximum size in kilobytes.',
                    required: true,
                })
            }
        }),
        stealth: Property.Checkbox({
            displayName: 'Stealth Mode',
            description: 'Hide signs of automation from bot detection.',
            required: false,
            advanced: true,
            defaultValue: false,
        }),
        blockAds: Property.Checkbox({
            displayName: 'Block Ads',
            description: 'Load the page with an ad blocker.',
            required: false,
            advanced: true,
            defaultValue: false,
        }),
        includeFullReport: Property.Checkbox({
            displayName: 'Include Full Report',
            description: 'Also return the full Lighthouse report, often several MB.',
            required: false,
            defaultValue: true,
        }),
    },
    outputSchema: browserlessOutputSchemas.getWebsitePerformance,
    async run(context) {
        const props = context.propsValue;
        const device = props.device === 'mobile' ? 'mobile' : 'desktop';
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Page Load Timeout', min: 1 });
        const selectedCategories = (props.categories ?? [])
            .map(browserlessValues.record)
            .map((entry) => entry['category'])
            .filter((category): category is string => typeof category === 'string' && category !== '');
        const onlyCategories =
            selectedCategories.length > 0 ? Array.from(new Set(selectedCategories)) : props.onlyCategories === true ? browserlessLighthouse.DEFAULT_CATEGORIES : undefined;
        const settings = browserlessLighthouse.buildSettings({
            device,
            onlyCategories,
            throttling: props.throttling,
            locale: props.locale,
            userAgent: props.userAgent,
            timeout,
        });

        const budgets = (props.budgets ?? [])
            .map(browserlessValues.record)
            .filter((budget) => browserlessBody.nonEmpty(String(budget['resourceType'] ?? '')))
            .map((budget) => ({
                resourceType: String(budget['resourceType']),
                budget: (browserlessBody.optionalNumber({ value: budget['budget'], label: 'Budget Size', min: 0 }) ?? 0) * 1024,
            }));

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/performance',
            body: {
                url: props.url,
                config: { extends: 'lighthouse:default', settings },
                ...(budgets.length > 0 ? { budgets } : {}),
            },
            query: {
                stealth: props.stealth === true ? true : undefined,
                blockAds: props.blockAds === true ? true : undefined,
            },
            timeoutMs: timeout === undefined ? undefined : timeout + 60_000,
            operation: 'Get Website Performance',
        });

        const report = browserlessLighthouse.summarize({ body: response.body, url: props.url, device });
        return {
            success: true,
            summary: report.summary,
            ...(props.includeFullReport === false ? {} : { fullReport: response.body }),
            metadata: {
                analysisTime: browserlessApi.headerValue({ headers: response.headers, name: 'x-response-time' }) ?? 'unknown',
                lighthouseVersion: report.lighthouseVersion,
            },
        };
    },
});

