
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { organizationIdDropdown, videoaskIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { videoaskAuth } from '../common/auth';
export const newReplyFromRespondent = createTrigger({
    auth: videoaskAuth,
    name: 'newReplyFromRespondent',
    displayName: 'new reply from respondent',
    description: '',
    props: {
        organizationId: organizationIdDropdown,
        videoaskId: videoaskIdDropdown,
        tag: Property.ShortText({
            displayName: 'Tag',
            description: 'A unique tag to identify the webhook',
            required: true,
        }),
    },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {

        await makeRequest(
            context.propsValue.organizationId as string,
            (context.auth as { access_token: string }).access_token,
            HttpMethod.PUT,
            `forms/${context.propsValue.videoaskId}/webhooks/${context.propsValue.tag}`,
            {
                url: context.webhookUrl,

                event_types: ['form_response', 'form_response_transcribed'],
            }
        );
    },
    async onDisable(context) {
        await makeRequest(
            context.propsValue.organizationId as string,
            (context.auth as { access_token: string }).access_token,
            HttpMethod.DELETE,
            `forms/${context.propsValue.videoaskId}/webhooks/${context.propsValue.tag}`
        );
    },
    async run(context) {
        return [context.payload.body]
    }
})