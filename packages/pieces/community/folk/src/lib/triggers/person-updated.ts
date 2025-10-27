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
    firstName: string;
    lastName: string;
    fullName: string;
    description: string;
    birthday: string | null;
    jobTitle: string;
    createdAt: string | null;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    groups: Array<{
        id: string;
        name: string;
    }>;
    companies: Array<{
        id: string;
        name: string;
    }>;
    addresses: string[];
    emails: string[];
    phones: string[];
    urls: string[];
    customFieldValues: Record<string, any>;
    interactionMetadata: {
        user: {
            approximateCount: number;
            lastInteractedAt: string | null;
        };
        workspace: {
            approximateCount: number;
            lastInteractedAt: string | null;
            lastInteractedBy: Array<{
                id: string;
                fullName: string;
                email: string;
            }>;
        };
    };
}

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const limit = 100;
        let cursor: string | undefined;
        const allPeople: FolkPerson[] = [];
        let hasMore = true;

        while (hasMore && allPeople.length < 500) {
            const response = await folkClient.getPeopleWithFilters({
                apiKey: auth as string,
                limit,
                cursor,
            });

            const people = response.data?.items || [];
            
            for (const person of people) {
                // For updates, we use the interaction metadata's last interaction time
                const lastInteractedAt = person.interactionMetadata?.workspace?.lastInteractedAt;
                if (lastInteractedAt) {
                    const updatedAtMs = new Date(lastInteractedAt).getTime();
                    if (!lastFetchEpochMS || updatedAtMs > lastFetchEpochMS) {
                        allPeople.push(person);
                    }
                }
            }

            // Check if there's a next page
            const nextLink = response.data?.pagination?.nextLink;
            if (nextLink) {
                // Extract cursor from nextLink URL
                const url = new URL(nextLink);
                cursor = url.searchParams.get('cursor') || undefined;
            } else {
                hasMore = false;
            }

            if (allPeople.length >= 500) {
                break;
            }
        }

        return allPeople.map((person) => {
            const lastInteractedAt = person.interactionMetadata?.workspace?.lastInteractedAt;
            return {
                epochMilliSeconds: lastInteractedAt ? new Date(lastInteractedAt).getTime() : Date.now(),
                data: person,
            };
        });
    },
};

export const personUpdated = createTrigger({
    auth: folkAuth,
    name: 'person_updated',
    displayName: 'Person Updated',
    description: 'Fires when a person is updated in your Folk workspace.',
    props: {},
    sampleData: {
        id: 'per_183ed5cc-3182-45de-84d1-d520f2604810',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        description: 'John Doe is a software engineer at Tech Corp.',
        birthday: '1980-06-15',
        jobTitle: 'Software Engineer',
        createdAt: '2021-01-01T00:00:00.000Z',
        createdBy: {
            id: 'usr_bc984b3f-0386-434d-82d7-a91eb6badd71',
            fullName: 'John Doe',
            email: 'john.doe@example.com'
        },
        groups: [
            {
                id: 'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2',
                name: 'Engineering'
            }
        ],
        companies: [
            {
                id: 'com_92346499-30bf-4278-ae8e-4aa3ae2ace2c',
                name: 'Tech Corp'
            }
        ],
        addresses: ['123 Main St, Springfield, USA'],
        emails: ['john@example.com'],
        phones: ['+1234567890'],
        urls: ['https://example.com'],
        customFieldValues: {},
        interactionMetadata: {
            user: {
                approximateCount: 21,
                lastInteractedAt: '2025-05-01T00:00:00Z'
            },
            workspace: {
                approximateCount: 21,
                lastInteractedAt: '2025-05-01T00:00:00Z',
                lastInteractedBy: [
                    {
                        id: 'usr_bc984b3f-0386-434d-82d7-a91eb6badd71',
                        fullName: 'John Doe',
                        email: 'john.doe@example.com'
                    }
                ]
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

