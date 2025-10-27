import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

interface FolkCompany {
    id: string;
    updatedAt: string;
    fields?: any;
    [key: string]: any;
}

const polling: Polling<PiecePropValueSchema<typeof folkAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const response = await folkClient.getCompanies({
            apiKey: auth as string,
            limit: 100,
        });

        const companies = response.companies || [];
        
        return companies
            .filter((company: FolkCompany) => company.fields && Object.keys(company.fields).length > 0)
            .map((company: FolkCompany) => ({
                epochMilliSeconds: new Date(company.updatedAt).getTime(),
                data: company,
            }));
    },
};

export const companyCustomFieldUpdated = createTrigger({
    auth: folkAuth,
    name: 'company_custom_field_updated',
    displayName: 'Company Custom Field Updated',
    description: 'Fires when a company custom field is updated in your Folk workspace.',
    props: {},
    sampleData: {
        id: 'cmp_12345',
        name: 'Example Company',
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

