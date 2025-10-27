import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

interface FolkCompany {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const limit = 100;
        let offset = 0;
        const allCompanies: FolkCompany[] = [];
        let hasMore = true;

        while (hasMore && allCompanies.length < 500) {
            const response = await folkClient.getCompanies({
                apiKey: auth as string,
                limit,
                offset,
            });

            const companies = response.companies || [];
            
            for (const company of companies) {
                const createdAtMs = new Date(company.createdAt).getTime();
                if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
                    allCompanies.push(company);
                }
            }

            if (companies.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }

            if (allCompanies.length >= 500) {
                break;
            }
        }

        return allCompanies.map((company) => ({
            epochMilliSeconds: new Date(company.createdAt).getTime(),
            data: company,
        }));
    },
};

export const companyAdded = createTrigger({
    auth: folkAuth,
    name: 'company_added',
    displayName: 'Company Added',
    description: 'Fires when a new company is added to your Folk workspace.',
    props: {},
    sampleData: {
        id: 'cmp_12345',
        name: 'Example Company',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        emails: ['contact@example.com'],
        links: ['https://example.com'],
        addresses: [],
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

