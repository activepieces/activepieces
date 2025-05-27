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
            .filter((entry: any) => dayjs(entry.created_date).valueOf() > lastFetchEpochMS)
            .map((entry: any) => ({
                epochMilliSeconds: dayjs(entry.created_date).valueOf(),
                data: entry,
            }));
    }
};

export const newEntrySubmitted = createTrigger({
    auth: cognitoFormsAuth,
    name: 'newEntrySubmitted',
    displayName: 'New Entry Submitted',
    description: 'Triggers when a new entry is submitted to a Cognito Form',
    props: {
        formId: Property.ShortText({
            displayName: 'Form ID',
            description: 'The ID of the form to monitor for new entries',
            required: true,
        })
    },
    sampleData: {
        id: '123',
        created_date: '2024-01-01T00:00:00Z',
        status: 'Submitted',
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