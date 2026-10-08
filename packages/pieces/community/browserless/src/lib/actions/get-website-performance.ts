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
    description: 'Analyze website performance metrics using Lighthouse',
    audience: 'human',
    aiMetadata: { description: 'Runs a Lighthouse audit on a public URL in a headless browser and returns performance, accessibility, best-practices and SEO scores (0-100) plus Core Web Vitals. Use to measure a page\'s quality; the URL is required, and you can scope the audit to specific categories and simulate a desktop or mobile device with network throttling. Read-only analysis: re-running with the same input re-audits the page without side effects (scores may vary slightly run to run).', idempotent: true },
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The URL of the website to analyze',
            required: true,
        }),
        categories: Property.Array({
            displayName: 'Performance Categories',
            description: 'Categories to audit (Lighthouse 12+ has no PWA category).',
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
            description: 'Device type for performance analysis',
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
            description: 'Network throttling simulation',
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
            description: 'Return only category scores without detailed audit results',
            required: false,
            defaultValue: false,
        }),
        locale: Property.ShortText({
            displayName: 'Locale',
            description: 'Locale for the analysis (e.g., en-US, de-DE)',
            required: false,
            defaultValue: 'en-US',
        }),
        userAgent: Property.ShortText({
            displayName: 'User Agent',
            description: 'Custom user agent string',
            required: false,
        }),
        timeout: Property.Number({
            displayName: 'Timeout (ms)',
            description: 'Max page load wait in ms during the audit (under 480000).',
            required: false,
            defaultValue: 60000,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'Not supported by Lighthouse audits; this setting is ignored.',
            required: false,
        }),
        emulateMediaType: Property.StaticDropdown({
            displayName: 'Emulate Media Type',
            description: 'Not supported by Lighthouse audits; this setting is ignored.',
            required: false,
            options: {
                options: [
                    { label: 'Screen', value: 'screen' },
                    { label: 'Print', value: 'print' }
                ]
            }
        }),
        budgets: Property.Array({
            displayName: 'Performance Budgets',
            description: 'Lighthouse performance budgets for resource sizes',
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
                    displayName: 'Budget Size (KB)',
                    description: 'Maximum allowed size in kilobytes',
                    required: true,
                })
            }
        }),
        stealth: Property.Checkbox({
            displayName: 'Stealth Mode',
            description: 'Enable stealth mode for bot detection bypass',
            required: false,
            defaultValue: false,
        }),
        blockAds: Property.Checkbox({
            displayName: 'Block Ads',
            description: 'Enable ad blocker during performance analysis',
            required: false,
            defaultValue: false,
        }),
        includeFullReport: Property.Checkbox({
            displayName: 'Include Full Report',
            description: 'Also return the full Lighthouse report (often several MB).',
            required: false,
            defaultValue: true,
        }),
    },
    outputSchema: browserlessOutputSchemas.getWebsitePerformance,
    async run(context) {
        const props = context.propsValue;
        const device = props.device === 'mobile' ? 'mobile' : 'desktop';
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Timeout', min: 1 });
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

