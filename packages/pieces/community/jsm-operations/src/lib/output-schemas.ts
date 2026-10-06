import { OutputSchema } from '@activepieces/pieces-framework';

export const alertOutputSchema: OutputSchema = {
    fields: alertFields(),
};

export const findAlertsOutputSchema: OutputSchema = {
    itemLabel: '{message}',
    fields: [
        {
            key: 'alerts',
            label: 'Alerts',
            value: '',
            labelKey: 'message',
            description: 'One entry per matching alert, in the chosen sort order.',
            listItems: alertFields(),
        },
    ],
};

export const requestResultOutputSchema: OutputSchema = {
    fields: requestResultFields(),
};

export const alertActionOutputSchema: OutputSchema = {
    fields: [
        ...requestResultFields(),
        { key: 'note_added', label: 'Note Added', format: 'boolean', description: 'Empty when no note was given.' },
        { key: 'note_error', label: 'Note Error', description: 'Why the note could not be added. The alert itself was still updated.' },
    ],
};

export const addNoteOutputSchema: OutputSchema = {
    fields: [
        ...requestResultFields(),
        { key: 'note_id', label: 'Note ID', description: 'Empty on API key connections, which process notes asynchronously.' },
        { key: 'note', label: 'Note' },
    ],
};

export const updateAlertOutputSchema: OutputSchema = {
    fields: [
        { key: 'alert_id', label: 'Alert ID' },
        { key: 'updated_fields', label: 'Updated Fields', description: 'Comma-separated list: message, description, priority.' },
        { key: 'processed', label: 'All Updates Processed', format: 'boolean' },
        {
            key: 'requests',
            label: 'Update Requests',
            labelKey: 'field',
            listItems: [{ key: 'field', label: 'Field' }, ...requestResultFields()],
        },
    ],
};

export const onCallOutputSchema: OutputSchema = {
    fields: [
        { key: 'schedule_id', label: 'Schedule ID' },
        { key: 'date', label: 'Checked At', format: 'datetime', description: 'Empty means the current time.' },
        { key: 'on_call_user_ids', label: 'On-Call User Account IDs', description: 'Comma-separated Atlassian account IDs.' },
        { key: 'on_call_user_count', label: 'On-Call User Count', format: 'number' },
        {
            key: 'participants',
            label: 'On-Call Participants',
            labelKey: 'id',
            description: 'Everyone on call, including users reached through a team or escalation.',
            listItems: [
                { key: 'id', label: 'ID' },
                { key: 'type', label: 'Type', description: 'user, team, escalation or schedule.' },
                { key: 'name', label: 'Name' },
                { key: 'parent_id', label: 'Reached Through ID', description: 'The team or escalation this user is on call for.' },
                { key: 'parent_type', label: 'Reached Through Type' },
                { key: 'forwarded_from_id', label: 'Forwarded From User ID' },
            ],
        },
    ],
};

function alertFields(): OutputSchema['fields'] {
    return [
        { key: 'id', label: 'Alert ID' },
        { key: 'tiny_id', label: 'Tiny ID' },
        { key: 'message', label: 'Message' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status', description: 'open, acked, snoozed, resolved or closed.' },
        { key: 'priority', label: 'Priority' },
        { key: 'alias', label: 'Alias' },
        { key: 'entity', label: 'Entity' },
        { key: 'source', label: 'Source' },
        { key: 'owner', label: 'Owner' },
        { key: 'acknowledged', label: 'Acknowledged', format: 'boolean' },
        { key: 'seen', label: 'Seen', format: 'boolean' },
        { key: 'snoozed', label: 'Snoozed', format: 'boolean' },
        { key: 'snoozed_until', label: 'Snoozed Until', format: 'datetime' },
        { key: 'count', label: 'Occurrence Count', format: 'number' },
        { key: 'tags', label: 'Tags', description: 'Comma-separated.' },
        { key: 'actions', label: 'Custom Actions', description: 'Comma-separated.' },
        { key: 'responders', label: 'Responders', description: 'Comma-separated type:id pairs.' },
        { key: 'extra_properties', label: 'Extra Properties', dynamicKey: true },
        { key: 'integration_name', label: 'Integration Name' },
        { key: 'integration_type', label: 'Integration Type' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'last_occurred_at', label: 'Last Occurred At', format: 'datetime' },
        { key: 'ack_time', label: 'Acknowledged At', format: 'datetime' },
        { key: 'close_time', label: 'Closed At', format: 'datetime' },
    ];
}

function requestResultFields(): OutputSchema['fields'] {
    return [
        { key: 'alert_id', label: 'Alert ID' },
        { key: 'alias', label: 'Alias' },
        { key: 'processed', label: 'Processed', format: 'boolean', description: 'False when the request was still queued after about 10 seconds.' },
        { key: 'success', label: 'Succeeded', format: 'boolean' },
        { key: 'status', label: 'Status Message' },
        { key: 'action', label: 'Action' },
        { key: 'request_id', label: 'Request ID' },
        { key: 'processed_at', label: 'Processed At', format: 'datetime' },
    ];
}
