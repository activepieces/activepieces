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
    description: 'Creates a new activity.', 
    props: {
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        ...activityCommonProps, 
    },
    async run(context) {
        const {
            subject,
            organizationId,
            personId,
            dealId,
            leadId,
            assignTo, 
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
            public_description: publicDescription,
            type,
            owner_id: assignTo, 
            due_time: dueTime,
            duration,
            done: isDone, 
            note
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
            method: HttpMethod.POST,
            resourceUri: '/v2/activities', 
            body: activityPayload,
        });

        return response;
    },
});