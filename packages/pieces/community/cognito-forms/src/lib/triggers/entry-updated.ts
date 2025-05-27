import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cognitoFormsAuth } from '../../index';
import dayjs from 'dayjs';

type PollingProps = {
    formId: string;
};

const polling: Polling<PiecePropValueSchema<typeof cognitoFormsAuth>, PollingProps> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS, auth }) => {
        const { formId } = propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://www.cognitoforms.com/api/forms/${formId}/entries`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth}`
            },
        });

        const entries = response.body.entries || [];
        return entries
            .filter((entry: any) => dayjs(entry.modified_date || entry.created_date).valueOf() > lastFetchEpochMS)
            .map((entry: any) => ({
                epochMilliSeconds: dayjs(entry.modified_date || entry.created_date).valueOf(),
                data: entry,
            }));
    }
};

export const entryUpdated = createTrigger({
    auth: cognitoFormsAuth,
    name: 'entryUpdated',
    displayName: 'Entry Updated',
    description: 'Triggers when an entry is updated in a Cognito Form',
    props: {
        formId: Property.ShortText({
            displayName: 'Form ID',
            description: 'The ID of the form to monitor for entry updates',
            required: true,
        })
    },
    sampleData: {
        id: '123',
        created_date: '2024-01-01T00:00:00Z',
        modified_date: '2024-01-02T00:00:00Z',
        status: 'Updated',
        data: {
            // Form fields will be here
        }
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});