import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../../common/auth';
import { browserlessApi } from '../../common/client';
import { browserlessLighthouse } from '../../common/lighthouse';
import { browserlessBody, browserlessProps } from '../../common/props';
import { browserlessOutputSchemas } from '../../output-schemas';

export const auditPagePerformance = createAction({
    auth: browserlessAuth,
    name: 'audit_page_performance',
    classification: 'READ',
    displayName: 'Audit Page Performance (Summary)',
    description: 'Run a Lighthouse audit and return only the scores, Core Web Vitals and top opportunities.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Runs a Google Lighthouse audit on a public URL and returns only a compact summary: 0-100 scores for performance, accessibility, best practices and SEO, Core Web Vitals and the main savings opportunities (never the multi-MB raw report). Use to judge page speed or SEO quality. Takes 20-60 seconds; scores vary slightly between runs, so a retry is safe.',
        idempotent: true,
    },
    props: {
        url: browserlessProps.url({ required: true, description: 'The page to audit, for example https://example.com' }),
        device: Property.StaticDropdown({
            displayName: 'Device',
            description: 'Audit as a desktop (default) or mobile visitor.',
            required: false,
            options: {
                options: [
                    { label: 'Desktop', value: 'desktop' },
                    { label: 'Mobile', value: 'mobile' },
                ],
            },
        }),
        categories: Property.StaticMultiSelectDropdown({
            displayName: 'Categories',
            description: 'Which scores to compute (all four when empty).',
            required: false,
            options: {
                options: [
                    { label: 'Performance', value: 'performance' },
                    { label: 'Accessibility', value: 'accessibility' },
                    { label: 'Best Practices', value: 'best-practices' },
                    { label: 'SEO', value: 'seo' },
                ],
            },
        }),
        timeout: Property.Number({
            displayName: 'Page Load Timeout (ms)',
            description: 'Max page load wait during the audit (default 45000).',
            required: false,
        }),
    },
    outputSchema: browserlessOutputSchemas.auditPagePerformance,
    async run(context) {
        const props = context.propsValue;
        const url = browserlessBody.httpUrl({ value: props.url, label: 'URL' });
        const device = props.device === 'mobile' ? 'mobile' : 'desktop';
        const categories = browserlessBody.textList(props.categories);
        const timeout = browserlessBody.optionalNumber({ value: props.timeout, label: 'Page Load Timeout', min: 1000, max: 480_000 }) ?? 45_000;

        const response = await browserlessApi.request<unknown>({
            auth: context.auth.props,
            method: HttpMethod.POST,
            path: '/performance',
            body: {
                url,
                config: {
                    extends: 'lighthouse:default',
                    settings: browserlessLighthouse.buildSettings({
                        device,
                        onlyCategories: categories.length > 0 ? Array.from(new Set(categories)) : browserlessLighthouse.DEFAULT_CATEGORIES,
                        timeout,
                    }),
                },
            },
            timeoutMs: timeout + 60_000,
            operation: 'Audit Page Performance',
        });

        const report = browserlessLighthouse.summarize({ body: response.body, url, device });
        const { scores, ...rest } = report.summary;
        return {
            ...rest,
            scores: {
                performance: scores.performance,
                accessibility: scores.accessibility,
                bestPractices: scores.bestPractices,
                seo: scores.seo,
            },
            lighthouseVersion: report.lighthouseVersion,
        };
    },
});
