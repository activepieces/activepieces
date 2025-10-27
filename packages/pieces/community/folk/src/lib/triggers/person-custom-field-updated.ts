import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

interface FolkPerson {
    id: string;
    customFieldValues: Record<string, any>;
    interactionMetadata: {
        workspace: {
            lastInteractedAt: string | null;
        };
    };
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const response = await folkClient.getPeopleWithFilters({
            apiKey: auth as string,
            limit: 100,
        });

        const people = response.data?.items || [];
        
        return people
            .filter((person: FolkPerson) => person.customFieldValues && Object.keys(person.customFieldValues).length > 0)
            .map((person: FolkPerson) => {
                const lastInteractedAt = person.interactionMetadata?.workspace?.lastInteractedAt;
                return {
                    epochMilliSeconds: lastInteractedAt ? new Date(lastInteractedAt).getTime() : Date.now(),
                    data: person,
                };
            });
    },
};

export const personCustomFieldUpdated = createTrigger({
    auth: folkAuth,
    name: 'person_custom_field_updated',
    displayName: 'Person Custom Field Updated',
    description: 'Fires when a person custom field is updated in your Folk workspace.',
    props: {},
    sampleData: {
        id: 'per_183ed5cc-3182-45de-84d1-d520f2604810',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        customFieldValues: {
            'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2': {
                'Status': 'Active',
                'Programming languages': ['Javascript', 'Python'],
                'Join date': '2021-01-01'
            }
        },
        interactionMetadata: {
            workspace: {
                lastInteractedAt: '2025-05-01T00:00:00Z'
            }
        }
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

