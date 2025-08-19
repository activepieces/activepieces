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
    description: 'Updates an existing activity.', 
    props: {
        activityId: Property.Number({
            displayName: 'Activity ID', 
            required: true,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            required: false,
        }),
        ...activityCommonProps, 
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
            isDone, 
            busy, 
            note,
            publicDescription,
        } = context.propsValue;

        const activityPayload: Record<string, any> = {
            subject,
            org_id: organizationId, 
            deal_id: dealId,       
            lead_id: leadId,      
            note,
            public_description: publicDescription,
            type,
            owner_id: assignTo,
            due_time: dueTime,
            duration,
            done: isDone, 
        };

        
        if (personId) {
            activityPayload.participants = [{ person_id: personId, primary: true }];
        }

         if (busy) {
			activityPayload.busy = busy === 'busy' ? true : false;
		}

        if (dueDate) {
            
            activityPayload.due_date = dayjs(dueDate).format('YYYY-MM-DD');
        }

       
        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH, 
            resourceUri: `/v2/activities/${activityId}`,
            body: activityPayload,
        });

        return response;
    },
});
