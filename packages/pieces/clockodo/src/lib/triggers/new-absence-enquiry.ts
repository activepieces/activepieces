import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { clockodoCommon, currentYear } from '../common';
import { ClockodoClient } from '../common/client';

interface AuthData {
    email: string,
    token: string,
    company_name: string,
    company_email: string
}

const polling: Polling<{ authentication: AuthData }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ propsValue }) => {
        const client = new ClockodoClient(
            propsValue.authentication.email,
            propsValue.authentication.token,
            propsValue.authentication.company_name,
            propsValue.authentication.company_email
        )
        const res = await client.listAbsences({ year: currentYear() })
        return res.absences.sort((a, b) => b.id - a.id).map((a) => ({
            id: a.id,
            data: a,
        }));
    }
}

export default createTrigger({
    name: 'new_absence_enquiry',
    displayName: 'New Absence Enquiry',
    description: 'Triggers when a new absence enquiry is created',
    type: TriggerStrategy.POLLING,
    props: {
        authentication: clockodoCommon.authentication
    },
    sampleData: {},
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    }
});