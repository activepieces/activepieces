import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatconvertsAuth } from '../common/auth';
import { whatconvertsCommon } from '../common/client';

export const createLead = createAction({
    name: 'create_lead',
    displayName: 'Create Lead',
    description: 'Create a new lead in WhatConverts with comprehensive lead information including contact details, attribution, and metadata.',
    auth: whatconvertsAuth,
    props: {
        profile_id: Property.Number({
            displayName: 'Profile ID',
            description: 'Unique identifier for the profile in which to add this lead to. Not required when using a Profile Key.',
            required: false,
        }),
        lead_type: Property.StaticDropdown({
            displayName: 'Lead Type',
            description: 'The type of lead',
            required: true,
            options: {
                options: [
                    { label: 'Phone Call', value: 'phone_call' },
                    { label: 'Web Form', value: 'web_form' },
                    { label: 'Chat', value: 'chat' },
                    { label: 'Text Message', value: 'text_message' },
                    { label: 'Email', value: 'email' },
                    { label: 'Appointment', value: 'appointment' },
                    { label: 'Event', value: 'event' },
                    { label: 'Transaction', value: 'transaction' },
                    { label: 'Other', value: 'other' }
                ]
            }
        }),
        send_notification: Property.Checkbox({
            displayName: 'Send Notification',
            description: 'Send an email notification for this lead',
            required: true,
            defaultValue: false,
        }),
        contact_name: Property.ShortText({
            displayName: 'Contact Name',
            description: 'Full name of the contact',
            required: false,
        }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'Email address of the contact',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            description: 'Phone number of the contact',
            required: false,
        }),
        quotable: Property.StaticDropdown({
            displayName: 'Quotable',
            description: 'The quotable type for this lead',
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
            description: 'The quote value for this lead',
            required: false,
        }),
        sales_value: Property.Number({
            displayName: 'Sales Value',
            description: 'The sales value for this lead',
            required: false,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Additional notes for the lead',
            required: false,
        }),
        lead_source: Property.ShortText({
            displayName: 'Lead Source',
            description: 'The traffic source for the lead (e.g., google, facebook)',
            required: false,
        }),
        lead_medium: Property.ShortText({
            displayName: 'Lead Medium',
            description: 'The traffic medium for the lead (e.g., cpc, organic)',
            required: false,
        }),
        lead_campaign: Property.ShortText({
            displayName: 'Lead Campaign',
            description: 'The campaign value for the lead',
            required: false,
        }),
        lead_keyword: Property.ShortText({
            displayName: 'Lead Keyword',
            description: 'The keyword value for the lead',
            required: false,
        }),
        lead_url: Property.ShortText({
            displayName: 'Lead URL',
            description: 'The URL where the lead took place',
            required: false,
        }),
        landing_url: Property.ShortText({
            displayName: 'Landing URL',
            description: 'The URL where the user arrived on the website',
            required: false,
        }),
        ip_address: Property.ShortText({
            displayName: 'IP Address',
            description: 'The user IP address for the lead',
            required: false,
        }),
        user_id: Property.ShortText({
            displayName: 'User ID',
            description: 'The WhatConverts user ID for the lead',
            required: false,
        }),
        message: Property.LongText({
            displayName: 'Message',
            description: 'Message content (for text_message, email, chat types)',
            required: false,
        }),
        caller_name: Property.ShortText({
            displayName: 'Caller Name',
            description: 'Caller name (for phone_call, text_message types)',
            required: false,
        }),
        caller_number: Property.ShortText({
            displayName: 'Caller Number',
            description: 'Caller phone number (for phone_call, text_message types)',
            required: false,
        }),
        tracking_number: Property.ShortText({
            displayName: 'Tracking Number',
            description: 'Tracking phone number (for phone_call, text_message types)',
            required: false,
        }),
        destination_number: Property.ShortText({
            displayName: 'Destination Number',
            description: 'Destination phone number (for phone_call type)',
            required: false,
        }),
        call_duration_seconds: Property.Number({
            displayName: 'Call Duration (Seconds)',
            description: 'Duration of the call in seconds (for phone_call type)',
            required: false,
        }),
        city: Property.ShortText({
            displayName: 'City',
            description: 'City location',
            required: false,
        }),
        state: Property.ShortText({
            displayName: 'State',
            description: 'State location',
            required: false,
        }),
        zip: Property.ShortText({
            displayName: 'ZIP Code',
            description: 'ZIP code',
            required: false,
        }),
        country: Property.ShortText({
            displayName: 'Country',
            description: 'Country location',
            required: false,
        }),
        additional_fields: Property.Array({
            displayName: 'Additional Fields',
            description: 'Additional custom fields for this lead',
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
        const leadData: Record<string, any> = {
            lead_type: props['lead_type'],
            send_notification: props['send_notification'],
        };

        if (props['profile_id']) {
            leadData['profile_id'] = props['profile_id'];
        }

        const response = await whatconvertsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/leads',
            body: leadData
        });

        return response.body;
    },
});
