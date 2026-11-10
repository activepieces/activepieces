import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { sobjectCreateResponseOutputSchema } from '../output-schemas';

export const createTask = createAction({
    auth: salesforceAuth,
    name: 'create_task',
    classification: 'WRITE',
    displayName: 'Create Task',
    description: 'Creates a task.',
    audience: 'human',
    aiMetadata: { description: 'Create a new activity Task with a required Subject and optional owner, status, priority, and links to a Contact/Lead (WhoId) or other object (WhatId). Not idempotent — each call creates a separate task.', idempotent: false },
    outputSchema: sobjectCreateResponseOutputSchema,
    propertyGroups: [
        { key: 'task', display: 'section', label: 'Task', icon: 'text', props: ['Subject', 'Description'] },
        { key: 'assignment', display: 'section', label: 'Assignment', icon: 'user', props: ['OwnerId', 'Status', 'Priority'] },
        { key: 'related', display: 'section', label: 'Related To', icon: 'paperclip', props: ['WhoId', 'WhatId'] },
    ],
    props: {
        Subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
            placeholder: 'Call back about the renewal',
        }),
        OwnerId: salesforcesCommon.owner,
        Status: salesforcesCommon.taskStatus,
        Priority: salesforcesCommon.taskPriority,
        Description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        WhoId: Property.ShortText({
            displayName: 'Contact or Lead ID',
            description: 'ID of the contact or lead, from its record URL or an earlier step.',
            required: false,
            placeholder: '0035g00000AbCdEAAZ',
        }),
        WhatId: Property.ShortText({
            displayName: 'Related Record ID',
            description: 'Account, case or other record ID, from its URL or an earlier step.',
            required: false,
            placeholder: '0015g00000XyZ12AAB',
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