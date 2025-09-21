import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatconvertsAuth } from '../common/auth';
import { whatconvertsCommon } from '../common/client';

export const findLead = createAction({
    name: 'find_lead',
    displayName: 'Find Leads',
    description: 'Retrieve leads with comprehensive filtering options including pagination, dates, lead types, contact information, attribution data, and more.',
    auth: whatconvertsAuth,
    props: {
        leads_per_page: Property.Number({
            displayName: 'Leads Per Page',
            description: 'Number of leads to return (default 25, maximum 2500)',
            required: false,
            defaultValue: 25,
        }),
        page_number: Property.Number({
            displayName: 'Page Number',
            description: 'Page number to return',
            required: false,
            defaultValue: 1,
        }),
        account_id: Property.Number({
            displayName: 'Account ID',
            description: 'Unique identifier for the account (Agency Key only)',
            required: false,
        }),
        profile_id: Property.Number({
            displayName: 'Profile ID',
            description: 'Unique identifier for the profile (Agency Key only)',
            required: false,
        }),
        lead_type: Property.StaticDropdown({
            displayName: 'Lead Type',
            description: 'Lead type to return',
            required: false,
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
        lead_status: Property.StaticDropdown({
            displayName: 'Lead Status',
            description: 'Lead status to return',
            required: false,
            options: {
                options: [
                    { label: 'Unique', value: 'unique' },
                    { label: 'Repeat', value: 'repeat' }
                ]
            }
        }),
        start_date: Property.ShortText({
            displayName: 'Start Date',
            description: 'Start date in date or date/time ISO 8601 format (UTC); 2015-11-10 or 2015-11-10T00:00:00Z',
            required: false,
        }),
        end_date: Property.ShortText({
            displayName: 'End Date',
            description: 'End date in date or date/time ISO 8601 format (UTC); 2015-11-10 or 2015-11-10T00:00:00Z',
            required: false,
        }),
        order: Property.StaticDropdown({
            displayName: 'Order',
            description: 'Order in which to return the leads by date created',
            required: false,
            options: {
                options: [
                    { label: 'Descending (newest first)', value: 'desc' },
                    { label: 'Ascending (oldest first)', value: 'asc' }
                ]
            }
        }),
        quotable: Property.StaticDropdown({
            displayName: 'Quotable',
            description: 'Quotable type to return',
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
        quote_value: Property.StaticDropdown({
            displayName: 'Quote Value Filter',
            description: 'Return leads that have a quote value',
            required: false,
            options: {
                options: [
                    { label: 'Has Value', value: 'has_value' },
                    { label: 'No Value', value: 'no_value' }
                ]
            }
        }),
        sales_value: Property.StaticDropdown({
            displayName: 'Sales Value Filter',
            description: 'Return leads that have a sales value',
            required: false,
            options: {
                options: [
                    { label: 'Has Value', value: 'has_value' },
                    { label: 'No Value', value: 'no_value' }
                ]
            }
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            description: 'Return leads for contacts with this E.164 formatted phone number',
            required: false,
        }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'Return leads for contacts with this email address',
            required: false,
        }),
        user_id: Property.ShortText({
            displayName: 'User ID',
            description: 'Return leads for contacts with this user ID',
            required: false,
        }),
        spam: Property.Checkbox({
            displayName: 'Spam Leads Only',
            description: 'Return only spam leads',
            required: false,
        }),
        duplicate: Property.Checkbox({
            displayName: 'Duplicate Leads Only',
            description: 'Return only duplicate leads',
            required: false,
        }),
        lead_source: Property.ShortText({
            displayName: 'Lead Source',
            description: 'Return leads that have this lead source',
            required: false,
        }),
        lead_medium: Property.ShortText({
            displayName: 'Lead Medium',
            description: 'Return leads that have this lead medium',
            required: false,
        }),
        lead_campaign: Property.ShortText({
            displayName: 'Lead Campaign',
            description: 'Return leads that have this lead campaign',
            required: false,
        }),
        lead_content: Property.ShortText({
            displayName: 'Lead Content',
            description: 'Return leads that have this lead content',
            required: false,
        }),
        lead_keyword: Property.ShortText({
            displayName: 'Lead Keyword',
            description: 'Return leads that have this lead keyword',
            required: false,
        }),
        customer_journey: Property.Checkbox({
            displayName: 'Include Customer Journey',
            description: 'Return the customer journey with the lead (Elite plans only)',
            required: false,
        })
    },
    async run(context) {
        const props = context.propsValue as Record<string, any>;
        const queryParams: Record<string, string> = {};

        if (props['leads_per_page']) queryParams['leads_per_page'] = props['leads_per_page'].toString();
        if (props['page_number']) queryParams['page_number'] = props['page_number'].toString();
        if (props['account_id']) queryParams['account_id'] = props['account_id'].toString();
        if (props['profile_id']) queryParams['profile_id'] = props['profile_id'].toString();
        if (props['lead_type']) queryParams['lead_type'] = props['lead_type'];
        if (props['lead_status']) queryParams['lead_status'] = props['lead_status'];
        if (props['start_date']) queryParams['start_date'] = props['start_date'];
        if (props['end_date']) queryParams['end_date'] = props['end_date'];
        if (props['order']) queryParams['order'] = props['order'];
        if (props['quotable']) queryParams['quotable'] = props['quotable'];
        if (props['quote_value']) queryParams['quote_value'] = props['quote_value'];
        if (props['sales_value']) queryParams['sales_value'] = props['sales_value'];
        if (props['phone_number']) queryParams['phone_number'] = props['phone_number'];
        if (props['email_address']) queryParams['email_address'] = props['email_address'];
        if (props['user_id']) queryParams['user_id'] = props['user_id'];
        if (props['spam']) queryParams['spam'] = 'true';
        if (props['duplicate']) queryParams['duplicate'] = 'true';
        if (props['lead_source']) queryParams['lead_source'] = props['lead_source'];
        if (props['lead_medium']) queryParams['lead_medium'] = props['lead_medium'];
        if (props['lead_campaign']) queryParams['lead_campaign'] = props['lead_campaign'];
        if (props['lead_content']) queryParams['lead_content'] = props['lead_content'];
        if (props['lead_keyword']) queryParams['lead_keyword'] = props['lead_keyword'];
        if (props['customer_journey']) queryParams['customer_journey'] = 'true';

        const response = await whatconvertsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/leads',
            queryParams: queryParams
        });

        return response.body;
    },
});
