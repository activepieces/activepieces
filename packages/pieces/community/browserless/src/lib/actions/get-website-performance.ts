import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { browserlessAuth } from '../common/auth';
import { browserlessCommon } from '../common/client';

export const getWebsitePerformance = createAction({
    name: 'get_website_performance',
    displayName: 'Get Website Performance',
    description: 'Analyze website performance metrics using Lighthouse',
    auth: browserlessAuth,
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'The URL of the website to analyze',
            required: true,
        }),
        categories: Property.Array({
            displayName: 'Performance Categories',
            description: 'Select which performance categories to analyze (performance, accessibility, best-practices, seo, pwa)',
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
            description: 'Maximum time to wait for the analysis to complete',
            required: false,
            defaultValue: 60000,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Selector',
            description: 'CSS selector to wait for before running performance analysis',
            required: false,
        }),
        emulateMediaType: Property.StaticDropdown({
            displayName: 'Emulate Media Type',
            description: 'Emulate CSS media type',
            required: false,
            options: {
                options: [
                    { label: 'Screen', value: 'screen' },
                    { label: 'Print', value: 'print' }
                ]
            }
        }),
    },
    async run(context) {
        const requestBody: any = {
            url: context.propsValue.url,
            options: {
                onlyCategories: context.propsValue.onlyCategories || false,
                locale: context.propsValue.locale || 'en-US',
            }
        };

        if (context.propsValue.categories && context.propsValue.categories.length > 0) {
            requestBody.options.categories = context.propsValue.categories.map((cat: any) => cat.category);
        }

        if (context.propsValue.device) {
            requestBody.options.device = context.propsValue.device;
        }

        if (context.propsValue.throttling && context.propsValue.throttling !== 'none') {
            requestBody.options.throttling = context.propsValue.throttling;
        }

        if (context.propsValue.userAgent) {
            requestBody.options.userAgent = context.propsValue.userAgent;
        }

        if (context.propsValue.timeout) {
            requestBody.options.timeout = context.propsValue.timeout;
        }

        if (context.propsValue.waitForSelector) {
            requestBody.options.waitForSelector = context.propsValue.waitForSelector;
        }

        if (context.propsValue.emulateMediaType) {
            requestBody.options.emulateMediaType = context.propsValue.emulateMediaType;
        }

        const response = await browserlessCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/performance',
            body: requestBody,
        });

        const performanceData = response.body;
        
        const summary: any = {
            url: context.propsValue.url,
            device: context.propsValue.device || 'desktop',
            timestamp: new Date().toISOString(),
        };

        if (performanceData.lhr && performanceData.lhr.categories) {
            const categories = performanceData.lhr.categories;
            summary.scores = {
                performance: categories.performance?.score ? Math.round(categories.performance.score * 100) : null,
                accessibility: categories.accessibility?.score ? Math.round(categories.accessibility.score * 100) : null,
                bestPractices: categories['best-practices']?.score ? Math.round(categories['best-practices'].score * 100) : null,
                seo: categories.seo?.score ? Math.round(categories.seo.score * 100) : null,
                pwa: categories.pwa?.score ? Math.round(categories.pwa.score * 100) : null,
            };
        }

        if (performanceData.lhr && performanceData.lhr.audits) {
            const audits = performanceData.lhr.audits;
            summary.metrics = {
                firstContentfulPaint: {
                    value: audits['first-contentful-paint']?.displayValue || null,
                    score: audits['first-contentful-paint']?.score ? Math.round(audits['first-contentful-paint'].score * 100) : null
                },
                largestContentfulPaint: {
                    value: audits['largest-contentful-paint']?.displayValue || null,
                    score: audits['largest-contentful-paint']?.score ? Math.round(audits['largest-contentful-paint'].score * 100) : null
                },
                firstMeaningfulPaint: {
                    value: audits['first-meaningful-paint']?.displayValue || null,
                    score: audits['first-meaningful-paint']?.score ? Math.round(audits['first-meaningful-paint'].score * 100) : null
                },
                speedIndex: {
                    value: audits['speed-index']?.displayValue || null,
                    score: audits['speed-index']?.score ? Math.round(audits['speed-index'].score * 100) : null
                },
                timeToInteractive: {
                    value: audits['interactive']?.displayValue || null,
                    score: audits['interactive']?.score ? Math.round(audits['interactive'].score * 100) : null
                },
                totalBlockingTime: {
                    value: audits['total-blocking-time']?.displayValue || null,
                    score: audits['total-blocking-time']?.score ? Math.round(audits['total-blocking-time'].score * 100) : null
                },
                cumulativeLayoutShift: {
                    value: audits['cumulative-layout-shift']?.displayValue || null,
                    score: audits['cumulative-layout-shift']?.score ? Math.round(audits['cumulative-layout-shift'].score * 100) : null
                },
            };

            summary.opportunities = [];
            if (audits['unused-css-rules']?.details?.items?.length > 0) {
                summary.opportunities.push({
                    type: 'unused-css',
                    title: 'Remove unused CSS',
                    potentialSavings: audits['unused-css-rules'].displayValue || 'Unknown'
                });
            }
            if (audits['unused-javascript']?.details?.items?.length > 0) {
                summary.opportunities.push({
                    type: 'unused-javascript',
                    title: 'Remove unused JavaScript',
                    potentialSavings: audits['unused-javascript'].displayValue || 'Unknown'
                });
            }
            if (audits['render-blocking-resources']?.details?.items?.length > 0) {
                summary.opportunities.push({
                    type: 'render-blocking',
                    title: 'Eliminate render-blocking resources',
                    potentialSavings: audits['render-blocking-resources'].displayValue || 'Unknown'
                });
            }
        }

        return {
            success: true,
            summary,
            fullReport: performanceData,
            metadata: {
                analysisTime: response.headers?.['x-response-time'] || 'unknown',
                lighthouseVersion: performanceData.lhr?.lighthouseVersion || 'unknown',
            }
        };
    },
});
