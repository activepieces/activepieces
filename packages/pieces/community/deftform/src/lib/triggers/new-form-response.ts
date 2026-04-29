import { createTrigger, TriggerStrategy, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { DeftformCommon } from '../common';

const props = {
    formId: DeftformCommon.formDropdown,
};

type TriggerProps = StaticPropsValue<typeof props>;

const polling: Polling<
    string,
    TriggerProps
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const response = await httpClient.sendRequest<{ data: any[] }>({
            method: HttpMethod.GET,
            url: `https://deftform.com/api/v1/responses/${propsValue.formId}`,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth as unknown as string,
            },
            queryParams: {
                sort: 'created_at',
                order: 'desc',
                limit: '100',
            },
        });

        return response.body.data.map((item) => ({
            epochMilliSeconds: item.created_at
                ? new Date(item.created_at).getTime()
                : Date.now(),
            data: {
                id: item.id ?? null,
                uuid: item.uuid ?? null,
                form_id: item.form_id ?? null,
                created_at: item.created_at ?? null,
                updated_at: item.updated_at ?? null,
                ...Object.fromEntries(
                    Object.entries(item.fields || {}).map(([k, v]) => [
                        `field_${k}`,
                        typeof v === 'object' ? JSON.stringify(v) : v,
                    ]),
                ),
            },
        }));
    },
};

export const newFormResponseTrigger = createTrigger({
    auth: deftformAuth,
    name: 'new_form_response',
    displayName: 'New Form Response',
    description: 'Triggers when a new response is submitted to a selected form.',
    props,
    sampleData: {
        id: '12345',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        form_id: '987',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z',
        field_name: 'Jane Doe',
        field_email: 'jane@example.com',
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
