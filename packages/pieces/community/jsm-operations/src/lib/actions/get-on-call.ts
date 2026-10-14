import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { jsmOpsProps } from '../common/props';
import { ApiOnCallParticipant, ApiOnCallResponse, OnCallParticipantOutput } from '../common/types';
import { onCallOutputSchema } from '../output-schemas';

export const getOnCallAction = createAction({
    auth: jsmOpsAuth,
    name: 'get_on_call',
    classification: 'READ',
    displayName: 'Get Who Is On Call',
    description: 'Get who is on call for a schedule, now or at a given time.',
    audience: 'both',
    aiMetadata: {
        description:
            'Returns the on-call participants of one JSM Operations schedule at the current time or a given date, including users reached through teams or escalations, plus a comma-separated list of on-call user account IDs. Needs an Atlassian account connection. Safe to retry.',
        idempotent: true,
    },
    props: {
        scheduleId: jsmOpsProps.schedule({
            displayName: 'Schedule',
            description: 'The on-call schedule to check.',
        }),
        date: Property.DateTime({
            displayName: 'At Time',
            description: 'Leave empty to check who is on call right now.',
            required: false,
        }),
    },
    outputSchema: onCallOutputSchema,
    async run(context) {
        const scheduleId = context.propsValue.scheduleId?.trim() ?? '';
        if (scheduleId.length === 0) {
            throw new Error('Pick the schedule to check.');
        }
        const date = toIsoDate(context.propsValue.date);
        const route = await jsmOps.requireAccountRoute({ auth: context.auth, feature: 'Get Who Is On Call' });
        const body = await jsmOps.send<ApiOnCallResponse>({
            route,
            method: HttpMethod.GET,
            path: `/schedules/${encodeURIComponent(scheduleId)}/on-calls`,
            queryParams: { flat: 'false', ...(date === null ? {} : { date }) },
        });
        const participants = flattenParticipants({ participants: body.onCallParticipants ?? [], parent: null });
        const userIds = [
            ...new Set([
                ...participants.flatMap((participant) => (participant.type === 'user' && participant.id !== null ? [participant.id] : [])),
                ...(body.onCallUsers ?? []),
            ]),
        ];
        return {
            schedule_id: scheduleId,
            date,
            on_call_user_ids: userIds.join(', '),
            on_call_user_count: userIds.length,
            participants,
        };
    },
});

function flattenParticipants({ participants, parent }: FlattenParams): OnCallParticipantOutput[] {
    return participants.flatMap((participant) => {
        const row: OnCallParticipantOutput = {
            id: participant.id ?? null,
            type: participant.type ?? null,
            name: participant.name ?? null,
            parent_id: parent?.id ?? null,
            parent_type: parent?.type ?? null,
            forwarded_from_id: participant.forwardedFrom?.id ?? null,
        };
        return [row, ...flattenParticipants({ participants: participant.onCallParticipants ?? [], parent: participant })];
    });
}

function toIsoDate(value: string | undefined): string | null {
    if (value === undefined || value.trim().length === 0) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('At Time must be a valid date and time.');
    }
    return parsed.toISOString();
}

type FlattenParams = {
    participants: ApiOnCallParticipant[];
    parent: ApiOnCallParticipant | null;
};
