import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

interface FolkPerson {
    id: string;
    updatedAt: string;
    fields?: any;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const response = await folkClient.getPeople({
            apiKey: auth as string,
            limit: 100,
        });

        const people = response.people || [];
        
        return people
            .filter((person: FolkPerson) => person.fields && Object.keys(person.fields).length > 0)
            .map((person: FolkPerson) => ({
                epochMilliSeconds: new Date(person.updatedAt).getTime(),
                data: person,
            }));
    },
};

export const personCustomFieldUpdated = createTrigger({
    auth: folkAuth,
    name: 'person_custom_field_updated',
    displayName: 'Person Custom Field Updated',
    description: 'Fires when a person custom field is updated in your Folk workspace.',
    props: {},
    sampleData: {
        id: 'per_12345',
        fullName: 'John Doe',
        updatedAt: '2024-01-01T00:00:00Z',
        fields: {
            customField: 'updated value',
        },
    },
    type: TriggerStrategy.POLLING,

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

    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});

