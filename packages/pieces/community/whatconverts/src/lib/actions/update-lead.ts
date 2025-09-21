import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatconvertsAuth } from '../common/auth';
import { whatconvertsCommon } from '../common/client';

export const updateLead = createAction({
    name: 'update_lead',
    displayName: 'Update Lead',
    description: 'Update an existing lead in WhatConverts. Only quotable status, quote/sales values, lead URL, and additional fields can be updated.',
    auth: whatconvertsAuth,
    props: {
        lead_id: Property.Number({
            displayName: 'Lead ID',
            description: 'The ID of the lead to update',
            required: true,
        }),
        quotable: Property.StaticDropdown({
            displayName: 'Quotable Status',
            description: 'The quotable type for the lead',
            required: false,
            options: {
                options: [
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Not Set', value: 'not_set' }
                ]
            }
        }),
        quote_value: Property.Number({
            displayName: 'Quote Value',
            description: 'The quote value for the lead',
            required: false,
        }),
        sales_value: Property.Number({
            displayName: 'Sales Value',
            description: 'The sales value for the lead',
            required: false,
        }),
        lead_url: Property.ShortText({
            displayName: 'Lead URL',
            description: 'The URL where the lead took place',
            required: false,
        }),
        additional_fields: Property.Array({
            displayName: 'Additional Fields',
            description: 'Additional fields for the lead',
            required: false,
            properties: {
                field_name: Property.ShortText({
                    displayName: 'Field Name',
                    required: true,
                }),
                field_value: Property.ShortText({
                    displayName: 'Field Value',
                    required: true,
                })
            }
        })
    },
    async run(context) {
        const props = context.propsValue as Record<string, any>;
        const leadData: Record<string, any> = {};

        
        const response = await whatconvertsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: `/leads/${props['lead_id']}`,
            body: leadData
        });

        return response.body;
    },
});
