import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyDropdown, opportunityDropdown, kaseDropdown, taskCategoryDropdown } from '../common/props';

export const createTask = createAction({
    auth: capsuleCrmAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new Task.',
    props: {
        description: Property.LongText({
            displayName: 'Description',
            description: 'What needs to be done?',
            required: true,
        }),
        detail: Property.LongText({
            displayName: 'Task Details',
            description: 'Add more details or notes to the task.',
            required: false,
        }),
        partyId: partyDropdown,
        opportunityId: opportunityDropdown,
        kaseId: kaseDropdown,
        categoryId: taskCategoryDropdown,
        dueOn: Property.ShortText({
            displayName: 'Due Date',
            description: 'The date the task is due (YYYY-MM-DD).',
            required: false,
        }),
        dueTime: Property.ShortText({
            displayName: 'Due Time',
            description: 'The time the task is due (HH:MM:SS).',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            description,
            detail,
            partyId,
            opportunityId,
            kaseId,
            categoryId,
            dueOn,
            dueTime
        } = propsValue;

        const taskPayload: { [key: string]: any } = {
            description,
            detail,
            dueOn,
            dueTime
        };

        if (partyId) taskPayload['party'] = { id: partyId };
        if (opportunityId) taskPayload['opportunity'] = { id: opportunityId };
        if (kaseId) taskPayload['kase'] = { id: kaseId };
        if (categoryId) taskPayload['category'] = { id: categoryId };
        

        Object.keys(taskPayload).forEach(key => {
            if (taskPayload[key] === undefined) {
                delete taskPayload[key];
            }
        });

        const response = await makeRequest(
            auth,
            HttpMethod.POST,
            '/tasks',
            { task: taskPayload }
        );

        return response;
    },
});