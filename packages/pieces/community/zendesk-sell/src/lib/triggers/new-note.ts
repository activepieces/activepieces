import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
    StaticPropsValue,
    Property,
} from '@activepieces/pieces-framework';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import dayjs from 'dayjs';


const props = {
    resource_type: Property.StaticDropdown({
        displayName: 'Resource Type',
        description: 'The type of record to monitor for new notes.',
        required: true,
        options: {
            options: [
                { label: 'Lead', value: 'lead' },
                { label: 'Contact', value: 'contact' },
                { label: 'Deal', value: 'deal' },
            ]
        }
    }),
    resource_id: Property.DynamicProperties({
        displayName: 'Record',
        description: 'The specific record to watch for new notes.',
        required: true,
        refreshers: ['resource_type'],
        props: async (propsValue) => {
            const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
            const resource_type = propsValue['resource_type'] as unknown as string | undefined;

            if (!auth || !resource_type) return {};
            const fields: any = {};
            
            switch (resource_type) {
                case 'lead':
                    fields.id = zendeskSellCommon.lead(true);
                    break;
                case 'contact':
                    fields.id = zendeskSellCommon.contact(true);
                    break;
                case 'deal':
                    fields.id = zendeskSellCommon.deal(true);
                    break;
            }
            return fields;
        }
    }),
};


interface Note {
    id: number;
    created_at: string;
    [key: string]: unknown;
}

const polling: Polling<ZendeskSellAuth, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const resourceType = propsValue.resource_type;
        const resourceId = (propsValue.resource_id as any)?.id;

        if (!resourceType || !resourceId) {
            return []; 
        }

        const endpoint = `v2/${resourceType}s/${resourceId}/notes?sort_by=created_at:desc&per_page=100`;
        
        const response = await callZendeskApi<{ items: { data: Note }[] }>(
            HttpMethod.GET,
            endpoint,
            auth
        );

        const notes = response.body?.items.map(item => item.data) || [];
        
        const newNotes = notes.filter(note => 
            dayjs(note.created_at).valueOf() > lastFetchEpochMS
        );

        return newNotes.reverse().map((note) => ({
            epochMilliSeconds: dayjs(note.created_at).valueOf(),
            data: note,
        }));
    },
};

export const newNote = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_note',
    displayName: 'New Note',
    description: 'Fires when a new note is added to a record (lead, contact, deal).',
    props: props,
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "resource_type": "lead",
        "resource_id": 1,
        "content": "Highly important.",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T17:32:56Z",
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