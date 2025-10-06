// src/lib/actions/create-calendar-note.ts

import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
// 👇 Import the necessary types
import { simplybookMeAuth, SimplybookMeAuthData } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props";

const formatToApiDateTime = (isoDate: string): string => {
    if (!isoDate) return '';
    return isoDate.replace('T', ' ').substring(0, 19);
};

export const createCalendarNote = createAction({
    auth: simplybookMeAuth,
    name: 'create_calendar_note',
    displayName: 'Create Calendar Note',
    description: 'Creates a new note on the calendar, which can optionally block time.',
    props: {
        provider_id: simplybookMeProps.unitId(),
        start_date_time: Property.DateTime({
            displayName: 'Start Time',
            required: true,
        }),
        end_date_time: Property.DateTime({
            displayName: 'End Time',
            required: true,
        }),
        note: Property.LongText({
            displayName: 'Note Content',
            required: true,
        }),
        time_blocked: Property.Checkbox({
            displayName: 'Block Time',
            description: 'If checked, this note will block the time slot on the calendar.',
            required: true, 
            defaultValue: false,
        }),
        service_id: simplybookMeProps.serviceId(false),
        note_type_id: Property.ShortText({
            displayName: 'Note Type ID',
            description: 'The ID for the type of note (e.g., "1" for a general note).',
            required: true, 
            defaultValue: "1",
        }),
    },

    async run(context) {
        const {
            provider_id,
            start_date_time,
            end_date_time,
            note,
            time_blocked,
            service_id,
            note_type_id
        } = context.propsValue;

        // 👇 FIX: Revert to the simple client constructor
        const client = new SimplybookMeClient(context.auth as SimplybookMeAuthData);

        const requestBody = {
            provider_id: parseInt(provider_id as string, 10),
            start_date_time: formatToApiDateTime(start_date_time),
            end_date_time: formatToApiDateTime(end_date_time),
            note: note,
            time_blocked: time_blocked,
            service_id: service_id ? parseInt(service_id as string, 10) : null,
            note_type_id: note_type_id,
            mode: "provider",
        };

        return await client.makeRequest(
            HttpMethod.POST, 
            '/admin/calendar-notes',
            requestBody
        );
    },
});