import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { ApiResponder } from '../common/types';
import { requestResultOutputSchema } from '../output-schemas';

export const createAlertAction = createAction({
    auth: jsmOpsAuth,
    name: 'create_alert',
    classification: 'WRITE',
    displayName: 'Create Alert',
    description: 'Create a new alert and route it to teams, users or schedules.',
    audience: 'both',
    aiMetadata: {
        description:
            'Creates a JSM Operations (or Opsgenie) alert and waits up to about 10 seconds for it to be processed, returning the new alert ID. Works with both connection types. Set an alias to deduplicate: a second alert with an open alias only raises its count, so retries with the same alias are safe; without an alias each call creates a new alert.',
        idempotent: false,
    },
    props: {
        message: Property.ShortText({
            displayName: 'Message',
            description: 'Short summary of the problem. Up to 130 characters.',
            placeholder: 'e.g. CPU above 90% on web-01',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Full details of the alert. Up to 15,000 characters.',
            required: false,
        }),
        priority: jsmOpsProps.priority({ required: false, defaultValue: 'P3' }),
        alias: Property.ShortText({
            displayName: 'Alias',
            description: 'Your own unique key for the alert. Open duplicates are merged.',
            placeholder: 'e.g. web-01-high-cpu',
            required: false,
        }),
        responderTeams: jsmOpsProps.teams({
            displayName: 'Responder Teams',
            description: 'Teams to notify. Needs an Atlassian Account connection.',
        }),
        responderUsers: jsmOpsProps.users({
            displayName: 'Responder Users',
            description: 'Users to notify. Needs an Atlassian Account connection.',
        }),
        responderSchedules: jsmOpsProps.schedules({
            displayName: 'Responder Schedules',
            description: 'Schedules whose on-call users are notified.',
        }),
        responderEscalations: jsmOpsProps.escalations({
            displayName: 'Responder Escalations',
            description: 'Escalation policies to start for this alert.',
        }),
        responderNames: Property.Array({
            displayName: 'Responders by Name (API Key Connections)',
            description: 'For API key connections: responders by team name or user email.',
            required: false,
            advanced: true,
            properties: {
                type: Property.StaticDropdown({
                    displayName: 'Type',
                    required: true,
                    defaultValue: 'team',
                    options: {
                        options: [
                            { label: 'Team', value: 'team' },
                            { label: 'User (email)', value: 'user' },
                            { label: 'Schedule', value: 'schedule' },
                            { label: 'Escalation', value: 'escalation' },
                        ],
                    },
                }),
                name: Property.ShortText({
                    displayName: 'Name or Email',
                    required: true,
                }),
            },
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Labels for searching and grouping alerts.',
            required: false,
        }),
        entity: Property.ShortText({
            displayName: 'Entity',
            description: 'The server, service or app the alert is about.',
            placeholder: 'e.g. web-01',
            required: false,
            advanced: true,
        }),
        source: Property.ShortText({
            displayName: 'Source',
            description: 'The tool that raised the alert.',
            placeholder: 'e.g. Activepieces',
            required: false,
            advanced: true,
        }),
        note: Property.LongText({
            displayName: 'Note',
            description: 'A first note to attach to the alert.',
            required: false,
            advanced: true,
        }),
        extraProperties: Property.Object({
            displayName: 'Extra Properties',
            description: 'Custom key-value details shown on the alert.',
            required: false,
            advanced: true,
        }),
        actions: Property.Array({
            displayName: 'Custom Actions',
            description: 'Names of custom alert actions to show on the alert.',
            required: false,
            advanced: true,
        }),
        user: Property.ShortText({
            displayName: 'Created By',
            description: 'API key connections only: who is shown as the creator.',
            required: false,
            advanced: true,
        }),
    },
    outputSchema: requestResultOutputSchema,
    async run(context) {
        const props = context.propsValue;
        const route = await jsmOps.routeFor(context.auth);
        const message = props.message.trim();
        if (message.length === 0) {
            throw new Error('Enter an alert message.');
        }
        const namedResponders = toNamedResponders(props.responderNames);
        if (route.kind === 'account' && namedResponders.length > 0) {
            throw new Error(
                'Responders by Name only work with API key connections. Pick the responders from the Teams, Users, Schedules or Escalations lists instead.',
            );
        }
        const responders = [
            ...toIdResponders({ ids: props.responderTeams, type: 'team' }),
            ...toIdResponders({ ids: props.responderUsers, type: 'user' }),
            ...toIdResponders({ ids: props.responderSchedules, type: 'schedule' }),
            ...toIdResponders({ ids: props.responderEscalations, type: 'escalation' }),
            ...namedResponders,
        ];
        const details = toStringMap(props.extraProperties);
        const body = {
            message,
            ...optional({ key: 'alias', value: props.alias }),
            ...optional({ key: 'description', value: props.description }),
            ...optional({ key: 'priority', value: props.priority }),
            ...optional({ key: 'entity', value: props.entity }),
            ...optional({ key: 'source', value: props.source }),
            ...optional({ key: 'note', value: props.note }),
            ...(route.kind === 'key' ? optional({ key: 'user', value: props.user }) : {}),
            ...(responders.length > 0 ? { responders } : {}),
            ...listField({ key: 'tags', value: props.tags }),
            ...listField({ key: 'actions', value: props.actions }),
            ...(Object.keys(details).length > 0 ? { [route.kind === 'key' ? 'details' : 'extraProperties']: details } : {}),
        };
        return jsmOps.runAsync({ route, method: HttpMethod.POST, path: '/alerts', body, verb: 'create the alert' });
    },
});

function toIdResponders({ ids, type }: { ids: unknown; type: string }): ApiResponder[] {
    return jsmOps.parseStringList(ids).map((id) => ({ id, type }));
}

function toNamedResponders(rows: unknown): ApiResponder[] {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.flatMap((row) => {
        if (row === null || typeof row !== 'object' || !('type' in row) || !('name' in row)) {
            return [];
        }
        const type = typeof row.type === 'string' ? row.type : '';
        const name = typeof row.name === 'string' ? row.name.trim() : '';
        if (name.length === 0 || !RESPONDER_TYPES.includes(type)) {
            return [];
        }
        return [type === 'user' ? { username: name, type } : { name, type }];
    });
}

function toStringMap(value: unknown): Record<string, string> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return Object.fromEntries(
        Object.entries(value).flatMap(([key, item]) => {
            if (key.trim().length === 0 || item === undefined || item === null || item === '') {
                return [];
            }
            return [[key, typeof item === 'string' ? item : JSON.stringify(item)]];
        }),
    );
}

function optional({ key, value }: { key: string; value: string | undefined }): Record<string, string> {
    const trimmed = value?.trim() ?? '';
    return trimmed.length > 0 ? { [key]: trimmed } : {};
}

function listField({ key, value }: { key: string; value: unknown }): Record<string, string[]> {
    const list = jsmOps.parseStringList(value);
    return list.length > 0 ? { [key]: list } : {};
}

const RESPONDER_TYPES = ['team', 'user', 'schedule', 'escalation'];
