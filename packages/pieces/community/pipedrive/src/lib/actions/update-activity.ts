import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityCommonProps } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

export const updateActivityAction = createAction({
    auth: pipedriveAuth,
    name: 'update-activity',
    displayName: 'Update Activity',
    description: 'Updates an existing activity using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        activityId: Property.Number({
            displayName: 'Activity ID', // Changed from 'Activity' to 'Activity ID' for clarity
            required: true,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            required: false,
        }),
        ...activityCommonProps, // This should define props like organizationId, personId, dealId, leadId, assignTo, type, dueDate, dueTime, duration, idDone, isBusy, note, publicDescription
    },
    async run(context) {
        const {
            activityId,
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
            isDone, // Assuming this is a boolean (true/false) from a checkbox property
            busy, // Assuming this is a boolean (true/false) from a checkbox property
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
            done: isDone, // ✅ 'done' expects a boolean (true/false) in v2, not 1 or 0
            busy: busy, // ✅ 'busy_flag' renamed to 'busy' and expects a boolean (true/false)
        };

        // Pipedrive v2: person_id is read-only for activities.
        // It is set indirectly by adding a primary participant.
        // If personId is provided, ensure to include it in the participants array.
        if (personId) {
            activityPayload.participants = [{ person_id: personId, primary_flag: true }];
        }

        if (dueDate) {
            // 'due_date' is a date field, YYYY-MM-DD format is appropriate.
            activityPayload.due_date = dayjs(dueDate).format('YYYY-MM-DD');
        }

        // ✅ Use PATCH method for updates and specify v2 endpoint
        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH, // ✅ Changed from HttpMethod.PUT to HttpMethod.PATCH
            resourceUri: `/v2/activities/${activityId}`, // ✅ Updated to v2 endpoint
            body: activityPayload,
        });

        return response;
    },
});
