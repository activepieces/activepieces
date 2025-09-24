import { createTrigger, TriggerStrategy, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { makeRequest } from '../common/client';
import { SiteSpeakAuth } from '../common/auth';
import { chatbotIdDropdown } from '../common/dropdown';
const props = {
    chatbotId: chatbotIdDropdown,
}
const polling: Polling<string, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
        if (!propsValue.chatbotId) {
            return [];
        }
        const response = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/${propsValue.chatbotId}/leads`,
            undefined,
            {
                Accept: 'application/json',
            }
        );
        console.log(response);
        const leads = response || [];

        return leads
            .filter((lead: any) => lead.email)
            .map((lead: any) => ({
                epochMilliSeconds: dayjs(lead.created_at).valueOf(),
                data: lead,
            }));
    },
};

export const newLead = createTrigger({
    auth: SiteSpeakAuth,
    name: 'newLead',
    displayName: 'New Lead',
    description: 'Triggers when a new lead with an email address is created in SiteSpeakAI.',
    props,
    sampleData: {
        id: 'lead_12345',
        chatbot_id: 'chatbot_6789',
        visitor_id: 'visitor_9876',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: null,
        status: 'read',
        last_entry_at: '2023-09-30 13:10:39',
        created_at: '2023-09-30 13:10:19',
        updated_at: '2023-10-03 05:49:48',
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },

    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
