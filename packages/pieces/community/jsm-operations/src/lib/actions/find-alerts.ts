import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { ApiAlertList } from '../common/types';
import { findAlertsOutputSchema } from '../output-schemas';

export const findAlertsAction = createAction({
    auth: jsmOpsAuth,
    name: 'find_alerts',
    classification: 'SEARCH',
    displayName: 'Find Alerts',
    description: 'Search alerts with a JSM Operations search query.',
    audience: 'both',
    aiMetadata: {
        description:
            'Lists JSM Operations alerts that match an alert search query (for example status: open AND priority: P1), sorted and paged. Returns zero or more alerts. Use Get Alert when you already know the ID or alias. Needs an Atlassian account connection. Safe to retry.',
        idempotent: true,
    },
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: 'Alert search syntax. Leave empty to list all alerts.',
            placeholder: 'e.g. status: open AND priority: P1',
            required: false,
        }),
        sort: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'createdAt',
            options: {
                options: [
                    { label: 'Created at', value: 'createdAt' },
                    { label: 'Last occurred at', value: 'lastOccurredAt' },
                    { label: 'Inserted at', value: 'insertedAt' },
                    { label: 'Priority', value: 'priority' },
                ],
            },
        }),
        order: Property.StaticDropdown({
            displayName: 'Order',
            required: false,
            defaultValue: 'desc',
            options: {
                options: [
                    { label: 'Newest / highest first', value: 'desc' },
                    { label: 'Oldest / lowest first', value: 'asc' },
                ],
            },
        }),
        limit: Property.Number({
            displayName: 'Max Results',
            description: 'How many alerts to return, from 1 to 100.',
            required: false,
            defaultValue: 20,
            display: 'stepper',
            min: 1,
            max: 100,
            step: 1,
        }),
        offset: Property.Number({
            displayName: 'Skip',
            description: 'How many matching alerts to skip, for paging.',
            required: false,
            defaultValue: 0,
            advanced: true,
        }),
    },
    outputSchema: findAlertsOutputSchema,
    async run(context) {
        const route = await jsmOps.requireAccountRoute({ auth: context.auth, feature: 'Find Alerts' });
        const body = await jsmOps.send<ApiAlertList>({
            route,
            method: HttpMethod.GET,
            path: '/alerts',
            queryParams: buildFindQuery(context.propsValue),
        });
        return (body.values ?? []).map((alert) => jsmOps.toAlertOutput(alert));
    },
});

function buildFindQuery({ query, sort, order, limit, offset }: FindInput): Record<string, string> {
    const size = clamp({ value: limit ?? 20, min: 1, max: 100 });
    const skip = Math.max(0, Math.floor(offset ?? 0));
    const trimmed = query?.trim() ?? '';
    return {
        ...(trimmed.length > 0 ? { query: trimmed } : {}),
        sort: SORT_FIELDS.includes(sort ?? '') ? sort ?? 'createdAt' : 'createdAt',
        order: order === 'asc' ? 'asc' : 'desc',
        size: String(size),
        offset: String(skip),
    };
}

function clamp({ value, min, max }: { value: number; min: number; max: number }): number {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, Math.floor(value)));
}

const SORT_FIELDS = ['createdAt', 'lastOccurredAt', 'insertedAt', 'priority'];

type FindInput = {
    query?: string;
    sort?: string;
    order?: string;
    limit?: number;
    offset?: number;
};
