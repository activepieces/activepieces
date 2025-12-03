
import { workableAuth } from '../../index';
import { createTrigger, Property, TriggerStrategy, WebhookResponse } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAccountSubdomain } from '../common/get-subdomain';
import { workableCommon } from '../common/webhooks';

interface WebhookInformation {
    webhookId: string;
}

interface WorkableWebhookPayload {
    data: any;
    event_type: string;
    fired_at: string;
    id: string;
    resource_type: string;
}

export const newCandidate = createTrigger({
    auth: workableAuth,
    name: 'newCandidate',
    displayName: 'New Candidate',
    description: 'Triggers when new candidate submits application. Can be filtered by specific job and/or hiring pipeline stage.',
    props: {
        shortcode: Property.ShortText({
            displayName: "Shortcode",
            description: "Shortcode of specific job. Leave empty to trigger for all jobs.",
            required: false
        }),
        stage_slug: Property.ShortText({
            displayName: "Stage Slug",
            description: "Stage slug to filter by specific hiring pipeline stage (e.g., 'applied', 'phone_screen', 'interview', 'offer'). Leave empty to trigger for all stages.",
            required: false
        })
    },
    sampleData: {
        id: '123',
        name: 'John Doe',
        firstname: 'John',
        lastname: 'Doe',
        headline: 'Software Engineer',
        account: {
            subdomain: 'example',
            name: 'Example Inc.'
        },
        job: {
            shortcode: 'ENG123',
            title: 'Software Engineer'
        },
        stage: 'applied',
        disqualified: false,
        disqualification_reason: '',
        sourced: false,
        profile_url: 'https://example.workable.com/candidates/123',
        email: 'john.doe@example.com',
        domain: 'example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const accessToken = context.auth.secret_text;
        const subdomain = await getAccountSubdomain(accessToken);

        const shortcode = context.propsValue.shortcode || '';
        const stageSlug = context.propsValue.stage_slug || '';
        const webhookUrl = context.webhookUrl;
        const event = "candidate_created";

        const subscription = await workableCommon.subscribeWebhook(
            subdomain,
            accessToken,
            webhookUrl,
            event,
            {job_shortcode: shortcode, stage_slug: stageSlug}
        );

        await context.store?.put<WebhookInformation>('_new_candidate_created', {
            webhookId: subscription.id,
        })
    },
    async onDisable(context){
        // implement webhook deletion logic
        const accessToken = context.auth.secret_text;

        const webhookInfo = await context.store.get<WebhookInformation>('_new_candidate_created');

        if(webhookInfo?.webhookId) {
            const subdomain = await getAccountSubdomain(accessToken);
            await workableCommon.unsubscribeWebhook(subdomain, accessToken, webhookInfo.webhookId);
        }
    },
    async test(context){
        const accessToken = context.auth.secret_text;
        const subdomain = await getAccountSubdomain(accessToken);
        const shortcode = context.propsValue.shortcode || '';
        const stageSlug = context.propsValue.stage_slug || '';

        const queryParams: any = {};
        if (shortcode) {
            queryParams.shortcode = shortcode;
        }
        if (stageSlug) {
            queryParams.stage = stageSlug;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://${subdomain}.workable.com/spi/v3/candidates/`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json"
            },
            queryParams: queryParams
        });

        const candidates = response.body.candidates?.slice(0, 3) ?? [];
        return candidates;
    },
    async run(context){
        const payload = context.payload.body as WorkableWebhookPayload;
        return [payload.data]
    }
})