import { Property, createAction, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';
import { zendeskSellCommon } from '../common/props';

export const createNote = createAction({
    auth: zendeskSellAuth,
    name: 'create_note',
    displayName: 'Create Note',
    description: 'Add a note to a deal, lead, or contact.',
    props: {
        resource_type: Property.StaticDropdown({
            displayName: 'Resource Type',
            description: 'The type of resource to attach the note to.',
            required: true,
            options: {
                options: [
                    { label: 'Lead', value: 'lead' },
                    { label: 'Contact', value: 'contact' },
                    { label: 'Deal', value: 'deal' },
                ]
            }
        }),
        dynamic_resource_id: Property.DynamicProperties({
            auth: zendeskSellAuth,
            displayName: 'Resource ID',
            description: 'Select the specific resource to attach the note to.',
            required: true,
            refreshers: ['resource_type'],
            props: async (context) => {
                const resourceType = context['resource_type'] as unknown as string | undefined;
                const fields: DynamicPropsValue = {};

                if (!resourceType) return {};

                switch (resourceType) {
                    case 'lead':
                        fields['resource_id'] = zendeskSellCommon.lead(true);
                        break;
                    case 'contact':
                        fields['resource_id'] = zendeskSellCommon.contact(true);
                        break;
                    case 'deal':
                        fields['resource_id'] = zendeskSellCommon.deal(true);
                        break;
                }
                return fields;
            }
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The content of the note.',
            required: true,
        }),
        is_important: Property.Checkbox({
            displayName: 'Important',
            description: 'Mark the note as important (starred).',
            required: false,
        }),
        type: Property.StaticDropdown({
            displayName: 'Visibility',
            description: 'Define the note\'s visibility.',
            required: false,
            options: {
                options: [
                    { label: 'Regular (Default)', value: 'regular' },
                    { label: 'Restricted (Creator only)', value: 'restricted' },
                ]
            }
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'An array of tags to add to the note (e.g., ["premium", "follow-up"]).',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { resource_type, dynamic_resource_id, ...otherProps } = propsValue;

        const resource_id = (dynamic_resource_id as { resource_id: number })?.resource_id;

        if (!resource_id) {
            throw new Error('Resource ID is missing. Please select a resource.');
        }

        const rawBody: Record<string, unknown> = {
            resource_type,
            resource_id,
            ...otherProps,
        };

        const cleanedBody = Object.entries(rawBody).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }

            if (key === 'is_important' && value === false) {
                 acc[key] = value;
            }
            return acc;
        }, {} as Record<string, unknown>);

        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/notes',
            auth,
            { data: cleanedBody } 
        );

        return response.body;
    },
});