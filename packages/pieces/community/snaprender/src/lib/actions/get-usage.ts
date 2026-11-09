import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderApi } from '../common/client';
import { snaprenderOutputSchemas } from '../output-schemas';

export const getUsage = createAction({
    auth: snaprenderAuth,
    name: 'get_usage',
    classification: 'READ',
    displayName: 'Get Usage',
    description: 'Get your plan, the captures used and left this month, and when the month resets.',
    audience: 'both',
    aiMetadata: {
        description:
            'Returns the SnapRender plan, captures used, the monthly limit, captures remaining and the billing period dates. Use it to check the quota before a large batch or to alert when captures run low. Free and safe to repeat.',
        idempotent: true,
    },
    props: {},
    outputSchema: snaprenderOutputSchemas.usage,
    async run(context) {
        const response = await snaprenderApi.request<UsageResponse>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.GET,
            path: '/v1/usage',
            timeoutMs: 30_000,
        });
        const body = response.body;
        return {
            plan: body.plan ?? null,
            captures_used: body.usage?.screenshots_used ?? null,
            captures_limit: body.usage?.screenshots_limit ?? null,
            captures_remaining: body.usage?.screenshots_remaining ?? null,
            extra_credits: body.usage?.extra_credits ?? 0,
            period_start: body.period?.start ?? null,
            period_end: body.period?.end ?? null,
        };
    },
});

type UsageResponse = {
    plan?: string;
    period?: { start?: string; end?: string };
    usage?: {
        screenshots_used?: number;
        screenshots_limit?: number;
        screenshots_remaining?: number;
        extra_credits?: number;
    };
};
