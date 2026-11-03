import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    AppConnectionValueForAuthProperty,
    createTrigger,
    Property,
    StaticPropsValue,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { AlertOutput, ApiAlert, ApiAlertList } from '../common/types';
import { alertOutputSchema } from '../output-schemas';

export const newAlertTrigger = createTrigger({
    auth: jsmOpsAuth,
    name: 'new_alert',
    classification: 'READ',
    displayName: 'New Alert',
    description: 'Triggers when a new alert is created.',
    aiMetadata: {
        description:
            'Fires once per new JSM Operations alert, checked every few minutes, optionally limited by an alert search query. Each run carries one alert. Needs an Atlassian account connection.',
    },
    props: newAlertProps(),
    outputSchema: alertOutputSchema,
    sampleData: sampleAlert(),
    type: TriggerStrategy.POLLING,
    async test(context) {
        return pollingHelper.test(polling(), context);
    },
    async onEnable(context) {
        await jsmOps.requireAccountRoute({ auth: context.auth, feature: 'The New Alert trigger' });
        await pollingHelper.onEnable(polling(), context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling(), context);
    },
    async run(context) {
        return pollingHelper.poll(polling(), context);
    },
});

function newAlertProps() {
    return {
        query: Property.ShortText({
            displayName: 'Only Alerts Matching',
            description: 'Optional alert search query to filter new alerts.',
            placeholder: 'e.g. priority: P1 AND tag: production',
            required: false,
        }),
    };
}

function polling(): Polling<AppConnectionValueForAuthProperty<typeof jsmOpsAuth>, StaticPropsValue<NewAlertProps>> {
    return {
        strategy: DedupeStrategy.TIMEBASED,
        items: async ({ auth, propsValue, lastFetchEpochMS }) => {
            const alerts = await fetchNewAlerts({ auth, filter: propsValue.query, since: lastFetchEpochMS });
            return alerts.map((alert) => ({
                epochMilliSeconds: new Date(alert.createdAt ?? 0).getTime(),
                data: jsmOps.toAlertOutput(alert),
            }));
        },
    };
}

async function fetchNewAlerts({ auth, filter, since }: FetchParams): Promise<ApiAlert[]> {
    const route = await jsmOps.requireAccountRoute({ auth, feature: 'The New Alert trigger' });
    const query = buildPollQuery({ filter, since });
    const pages = since > 0 ? MAX_PAGES : 1;
    const size = since > 0 ? PAGE_SIZE : TEST_PAGE_SIZE;
    const found: ApiAlert[] = [];
    for (let page = 0; page < pages; page++) {
        const body = await jsmOps.send<ApiAlertList>({
            route,
            method: HttpMethod.GET,
            path: '/alerts',
            queryParams: {
                ...(query.length > 0 ? { query } : {}),
                sort: 'createdAt',
                order: since > 0 ? 'asc' : 'desc',
                size: String(size),
                offset: String(page * size),
            },
        });
        const values = body.values ?? [];
        found.push(...values);
        if (values.length < size) {
            break;
        }
    }
    return found;
}

function buildPollQuery({ filter, since }: { filter: string | undefined; since: number }): string {
    const trimmed = filter?.trim() ?? '';
    const parts = [
        ...(since > 0 ? [`createdAt > ${Math.floor(since)}`] : []),
        ...(trimmed.length > 0 ? [`(${trimmed})`] : []),
    ];
    return parts.join(' AND ');
}

function sampleAlert(): AlertOutput {
    return {
        id: '70413a06-38d6-4c85-92b8-5ebc900d42e2',
        tiny_id: '1791',
        message: 'CPU above 90% on web-01',
        description: 'CPU usage has been above 90% for 10 minutes.',
        status: 'open',
        priority: 'P2',
        alias: 'web-01-high-cpu',
        entity: 'web-01',
        source: 'Monitoring',
        owner: null,
        acknowledged: false,
        seen: false,
        snoozed: false,
        snoozed_until: null,
        count: 1,
        tags: 'production, cpu',
        actions: null,
        responders: 'team:4513b7ea-3b91-438f-b7e4-e3e54af9147c',
        extra_properties: { region: 'eu-west-1' },
        integration_name: 'API',
        integration_type: 'API',
        created_at: '2026-09-28T08:15:00.000Z',
        updated_at: '2026-09-28T08:15:00.000Z',
        last_occurred_at: '2026-09-28T08:15:00.000Z',
        ack_time: null,
        close_time: null,
    };
}

const MAX_PAGES = 5;
const PAGE_SIZE = 100;
const TEST_PAGE_SIZE = 10;

type NewAlertProps = ReturnType<typeof newAlertProps>;

type FetchParams = {
    auth: AppConnectionValueForAuthProperty<typeof jsmOpsAuth>;
    filter: string | undefined;
    since: number;
};
