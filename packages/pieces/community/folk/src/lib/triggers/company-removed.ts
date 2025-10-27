import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.LAST_ITEM,
    async items({ auth }) {
        const response = await folkClient.getCompanies({
            apiKey: auth as string,
            limit: 100,
        });

        const companies = response.companies || [];
        
        return companies
            .filter((company: any) => company.deletedAt)
            .map((company: any) => ({
                id: company.id,
                data: company,
            }));
    },
};

export const companyRemoved = createTrigger({
    auth: folkAuth,
    name: 'company_removed',
    displayName: 'Company Removed',
    description: 'Fires when a company is removed from your Folk workspace.',
    props: {},
    sampleData: {
        id: 'cmp_12345',
        name: 'Example Company',
        deletedAt: '2024-01-01T00:00:00Z',
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

