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
    fullName?: string;
    name?: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const limit = 100;
        let offset = 0;
        const allPeople: FolkPerson[] = [];
        let hasMore = true;

        while (hasMore && allPeople.length < 500) {
            const response = await folkClient.getPeople({
                apiKey: auth as string,
                limit,
                offset,
            });

            const people = response.people || [];
            
            for (const person of people) {
                const createdAtMs = new Date(person.createdAt).getTime();
                if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
                    allPeople.push(person);
                }
            }

            if (people.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }

            if (allPeople.length >= 500) {
                break;
            }
        }

        return allPeople.map((person) => ({
            epochMilliSeconds: new Date(person.createdAt).getTime(),
            data: person,
        }));
    },
};

export const personAdded = createTrigger({
    auth: folkAuth,
    name: 'person_added',
    displayName: 'Person Added',
    description: 'Fires when a new person is added to your Folk workspace.',
    props: {},
    sampleData: {
        id: 'per_12345',
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        emails: ['john@example.com'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
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

