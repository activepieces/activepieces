import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common';
import dayjs from 'dayjs';

interface Contact {
    id: number;
    updated_at: string;
    [key: string]: unknown;
}

const polling: Polling<ZendeskSellAuth, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await callZendeskApi<{ items: { data: Contact }[] }>(
            HttpMethod.GET,
            'v2/contacts?sort_by=updated_at:desc&per_page=100',
            auth
        );

        const contacts = response.body?.items.map(item => item.data) || [];
        
        const newContacts = contacts.filter(contact => 
            dayjs(contact.updated_at).valueOf() > lastFetchEpochMS
        );

        return newContacts.reverse().map((contact) => ({
            epochMilliSeconds: dayjs(contact.updated_at).valueOf(),
            data: contact,
        }));
    },
};

export const updatedContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_contact',
    displayName: 'Updated Contact',
    description: 'Fires when a contact is updated.',
    props: {},
    sampleData: {
        "id": 2,
        "owner_id": 1,
        "name": "Mark Johnson",
        "first_name": "Mark",
        "last_name": "Johnson",
        "customer_status": "current",
        "email": "mark@designservices.com",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T17:32:56Z"
      },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files
        });
    },
});