import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createTask = createAction({
    auth: salesforceAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Creates a new task.',
    props: {
        Subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        OwnerId: salesforcesCommon.owner,
        Status: salesforcesCommon.taskStatus,
        Priority: salesforcesCommon.taskPriority,
        Description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        WhoId: Property.ShortText({
            displayName: 'Related To (Contact/Lead ID)',
            description: 'The ID of a Contact or Lead to relate the task to.',
            required: false,
        }),
        WhatId: Property.ShortText({
            displayName: 'Related To (Other Object ID)',
            description: 'The ID of an Account, Opportunity, or other object to relate the task to.',
            required: false,
        }),
    },
    async run(context) {
        const {
            Subject,
            OwnerId,
            Status,
            Priority,
            Description,
            WhoId,
            WhatId
        } = context.propsValue;

        const rawBody = {
            Subject,
            OwnerId,
            Status,
            Priority,
            Description,
            WhoId,
            WhatId
        };

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/Task',
            cleanedBody
        );

        return response.body;
    },
});