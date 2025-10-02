import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { SenderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newCampaign = createTrigger({
    auth: SenderAuth,
    name: 'newCampaign',
    displayName: 'New Campaign',
    description: 'Triggers when a new campaign is created in Sender',
    props: {},

    sampleData: {
        id: "ej06yl",
        subject: "Scheduled campaign example subject",
        reply_to: "support@sender.net",
        language: "en",
        recipient_count: 1,
        from: "Sender Support",
        schedule_time: null,
        last_action: "editor",
        sent_time: null,
        status: "DRAFT",
        created: "2021-05-11 10:43:01",
        modified: "2021-05-11 10:48:33",
        title: "Scheduled campaign example subject",
        domain_id: "bDPoxb",
        preheader: "Scheduled campaign example preview text",
        auto_followup_active: 0,
        auto_followup_subject: "Follow up of Scheduled campaign example subject",
        auto_followup_delay: null,
        editor: "text",
        opens: 0,
        clicks: 0,
        bounces_count: 0,
        send_to_all: 0,
        html: {
            id: "bojGOK",
            thumbnail_url: "https://cdn.sender.net/email_images/9918/540045/html_PbMuBzY0fv9T.png?timestamp=1620744202",
            has_preview: true,
            html_content: "<p style=\"font-size: 14px; font-family: Arial, Helvetica, sans-serif;\">Hello</p>",
            html_body: null
        },
        sent_count: 0,
        campaign_groups: ["b2vAR1"],
        segments: []
    },

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl, 
            topic: 'campaigns/new',
        };

        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/account/webhooks',
            body
        );

        await context.store?.put('webhookId', response.id);
    },

    async onDisable(context) {
        const webhookId = await context.store?.get('webhookId');

        if (webhookId) {
            await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/account/webhooks/${webhookId}`
            );
        }
    },

    async run(context) {
        return [context.payload.body];
    },
});
