
import { workableAuth } from '../../index';
import { createTrigger, Property, TriggerStrategy, WebhookResponse } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAccountSubdomain } from '../common/get-subdomain';
import { workableCommon } from '../common/webhooks';

interface WebhookInformation {
    webhookId: string;
}

export const newCandidate = createTrigger({
    auth: workableAuth,
    name: 'newCandidate',
    displayName: 'New Candidate',
    description: 'Triggers when new candidate submits application.',
    props: {
        shortcode: Property.ShortText({
            displayName: "Shortcode",
            description: "Shortcode of specific job",
            required: true
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
        const accessToken = context.auth;
        const subdomain = await getAccountSubdomain(accessToken);

        const shortcode = context.propsValue.shortcode;
        const webhookUrl = context.webhookUrl;
        const event = "candidate_created";

        const subscription = await workableCommon.subscribeWebhook(
            subdomain,
            accessToken,
            webhookUrl,
            event,
            {job_shortcode: shortcode, stage_slug: ''}
        );

        await context.store?.put<WebhookInformation>('_new_candidate_created', {
            webhookId: subscription.id,
        })
    },
    async onDisable(context){
        // implement webhook deletion logic
        const accessToken = context.auth;

        const webhookInfo = await context.store.get<WebhookInformation>('_new_candidate_created');

        if(webhookInfo?.webhookId) {
            const subdomain = await getAccountSubdomain(accessToken);
            await workableCommon.unsubscribeWebhook(subdomain, accessToken, webhookInfo.webhookId);
        }
    },
    async test(context){
        const accessToken = context.auth;
        const subdomain = await getAccountSubdomain(accessToken);
        const shortcode = context.propsValue.shortcode;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://${subdomain}.workable.com/spi/v3/candidates/`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json"
            },
            queryParams: {
                shortcode: shortcode
            }
        });

        const candidates = response.body.candidates?.slice(0, 3) ?? [];
        return candidates;
    },
    async run(context){
        return [context.payload.body]
    }
})