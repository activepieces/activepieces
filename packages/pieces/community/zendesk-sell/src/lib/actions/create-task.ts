import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const createTask = createAction({
    auth: zendeskSellAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Creates a new task.',
    props: {
        content: Property.LongText({
            displayName: 'Content',
            description: 'The main text or description of the task.',
            required: true,
        }),
        resource_type: Property.StaticDropdown({
            displayName: 'Associate with Resource (Optional)',
            description: 'Optionally associate this task with a lead, contact, or deal.',
            required: false,
            options: {
                options: [
                    { label: 'Lead', value: 'lead' },
                    { label: 'Contact', value: 'contact' },
                    { label: 'Deal', value: 'deal' },
                ]
            }
        }),
        resource_id: Property.DynamicProperties({
            displayName: 'Resource',
            description: 'The specific record to associate the task with.',
            required: true,
            refreshers: ['resource_type'],
            props: async (propsValue) => {
                const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
                const resource_type = propsValue['resource_type'] as unknown as string | undefined;

                if (!auth || !resource_type) return {};

                const fields: any = {};
                switch (resource_type) {
                    case 'lead':
                        fields.resource_id = zendeskSellCommon.lead(true);
                        break;
                    case 'contact':
                        fields.resource_id = zendeskSellCommon.contact(true);
                        break;
                    case 'deal':
                        fields.resource_id = zendeskSellCommon.deal(true);
                        break;
                }
                return fields;
            }
        }),
        owner_id: zendeskSellCommon.owner(),
        due_date: Property.ShortText({
            displayName: 'Due Date',
            description: 'The date and time the task is due, in ISO 8601 format (e.g., "2025-10-24T10:00:00Z").',
            required: false,
        }),
        remind_at: Property.ShortText({
            displayName: 'Reminder Date',
            description: 'A date and time to send a reminder, in ISO 8601 format. Must be before the Due Date.',
            required: false,
        }),
        completed: Property.Checkbox({
            displayName: 'Completed',
            description: 'Set the task as completed upon creation.',
            required: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;

        const body: Record<string, unknown> = {
            content: propsValue.content,
            owner_id: propsValue.owner_id,
            due_date: propsValue.due_date,
            remind_at: propsValue.remind_at,
            completed: propsValue.completed,
        };

        if (propsValue.resource_type && propsValue.resource_id) {
            body['resource_type'] = propsValue.resource_type;
            body['resource_id'] = (propsValue.resource_id as any).resource_id;
        }

        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/tasks',
            auth as ZendeskSellAuth,
            body
        );

        return response.body;
    },
});