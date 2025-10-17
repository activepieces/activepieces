import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const createNote = createAction({
    auth: zendeskSellAuth,
    name: 'create_note',
    displayName: 'Create Note',
    description: 'Add a note to a deal, lead, or contact.',
    props: {
        resource_type: Property.StaticDropdown({
            displayName: 'Resource Type',
            description: 'The type of resource to which the note will be attached.',
            required: true,
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
            description: 'The specific lead, contact, or deal to attach the note to.',
            required: true,
            refreshers: ['resource_type'],
            props: async (propsValue) => {
                const auth = propsValue['auth'] as ZendeskSellAuth | undefined;
                const resource_type = propsValue['resource_type'] as unknown as string | undefined;

                if (!auth) return {};
                if (!resource_type) return {};

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
        content: Property.LongText({
            displayName: 'Content',
            description: 'The text content of the note.',
            required: true,
        }),
        is_important: Property.Checkbox({
            displayName: 'Important',
            description: 'Mark the note as important.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;

        const body = {
            resource_type: propsValue.resource_type,
            resource_id: (propsValue.resource_id as any).resource_id,
            content: propsValue.content,
            is_important: propsValue.is_important,
        };

        const response = await callZendeskApi(
            HttpMethod.POST,
            'v2/notes',
            auth as ZendeskSellAuth,
            { data: body }
        );

        return response.body;
    },
});