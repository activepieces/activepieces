import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityCommonProps } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

export const createActivityAction = createAction({
    auth: pipedriveAuth,
    name: 'create-activity',
    displayName: 'Create Activity',
    description: 'Creates a new activity using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        ...activityCommonProps, // This should define props like organizationId, personId, dealId, leadId, assignTo, type, dueDate, dueTime, duration, isDone, busy, note, publicDescription
    },
    async run(context) {
        const {
            subject,
            organizationId,
            personId,
            dealId,
            leadId,
            assignTo, // This is the user ID for the assignee
            type,
            dueDate,
            dueTime,
            duration,
            isDone,
            busy, 
            note,
            publicDescription,
        } = context.propsValue;

        const activityPayload: Record<string, any> = {
            subject,
            org_id: organizationId, // ✅ Ensure this is a number (ID)
            deal_id: dealId,       // ✅ Ensure this is a number (ID)
            lead_id: leadId,       // ✅ Ensure this is a string (UUID) or number (ID) as per Pipedrive Lead API
            note,
            public_description: publicDescription,
            type,
            owner_id: assignTo, // ✅ Renamed from user_id to owner_id for v2 consistency
            due_time: dueTime,
            duration,
            done: isDone, // ✅ 'done' expects a boolean (true/false) in v2
            busy: busy, // ✅ 'busy_flag' renamed to 'busy' and expects a boolean (true/false)
        };

        // Pipedrive v2: person_id is read-only for activities.
        // It is set indirectly by adding a primary participant.
        if (personId) {
            activityPayload.participants = [{ person_id: personId, primary_flag: true }];
        }

        if (dueDate) {
            // 'due_date' is a date field, YYYY-MM-DD format is appropriate.
            // Ensure dayjs is correctly imported and used for formatting to YYYY-MM-DD
            activityPayload.due_date = dayjs(dueDate).format('YYYY-MM-DD');
        }

        // ✅ Use v2 endpoint for creating an activity
        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/activities', // ✅ Updated to v2 endpoint
            body: activityPayload,
        });

        return response;
    },
});