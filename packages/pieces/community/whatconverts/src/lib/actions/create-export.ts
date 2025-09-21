import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatconvertsAuth } from '../common/auth';
import { whatconvertsCommon } from '../common/client';

export const createExport = createAction({
    name: 'create_export',
    displayName: 'Create Export',
    description: 'Create a new leads export with filtering and formatting options.',
    auth: whatconvertsAuth,
    props: {
        export_name: Property.ShortText({
            displayName: 'Export Name',
            description: 'Optional name for the export',
            required: false,
        }),
        start_date: Property.ShortText({
            displayName: 'Start Date',
            description: 'Start date for export (YYYY-MM-DD or ISO 8601 format)',
            required: false,
        }),
        end_date: Property.ShortText({
            displayName: 'End Date',
            description: 'End date for export (YYYY-MM-DD or ISO 8601 format)',
            required: false,
        }),
        lead_types: Property.MultiSelectDropdown({
            displayName: 'Lead Types',
            description: 'Filter export by specific lead types',
            required: false,
            refreshers: [],
            options: async () => ({
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
            })
        }),
        lead_status: Property.StaticDropdown({
            displayName: 'Lead Status',
            description: 'Filter by lead status',
            required: false,
            options: {
                options: [
                    { label: 'Unique', value: 'unique' },
                    { label: 'Repeat', value: 'repeat' }
                ]
            }
        }),
        quotable: Property.StaticDropdown({
            displayName: 'Quotable',
            description: 'Filter by quotable status',
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
        format: Property.StaticDropdown({
            displayName: 'Export Format',
            description: 'Format for the exported data',
            required: false,
            options: {
                options: [
                    { label: 'CSV', value: 'csv' },
                    { label: 'Excel (XLSX)', value: 'xlsx' },
                    { label: 'JSON', value: 'json' },
                    { label: 'XML', value: 'xml' }
                ]
            }
        }),
        include_custom_fields: Property.Checkbox({
            displayName: 'Include Custom Fields',
            description: 'Include custom/additional fields in the export',
            required: false,
            defaultValue: true,
        }),
        include_attribution: Property.Checkbox({
            displayName: 'Include Attribution Data',
            description: 'Include attribution and tracking data in the export',
            required: false,
            defaultValue: true,
        }),
        include_customer_journey: Property.Checkbox({
            displayName: 'Include Customer Journey',
            description: 'Include customer journey data (Elite plans only)',
            required: false,
            defaultValue: false,
        }),
        email_notification: Property.Checkbox({
            displayName: 'Email Notification',
            description: 'Send email notification when export is ready',
            required: false,
            defaultValue: true,
        }),
        webhook_url: Property.ShortText({
            displayName: 'Webhook URL',
            description: 'URL to notify when export is completed',
            required: false,
        })
    },
    async run(context) {
        const props = context.propsValue as Record<string, any>;
        const exportData: Record<string, any> = {
            export_type: 'leads',
        };

        if (props['export_name']) exportData['name'] = props['export_name'];
        if (props['start_date']) exportData['start_date'] = props['start_date'];
        if (props['end_date']) exportData['end_date'] = props['end_date'];
        if (props['lead_types'] && props['lead_types'].length > 0) {
            exportData['lead_types'] = props['lead_types'];
        }
        if (props['lead_status']) exportData['lead_status'] = props['lead_status'];
        if (props['quotable']) exportData['quotable'] = props['quotable'];
        if (props['format']) exportData['format'] = props['format'];
        if (props['include_custom_fields'] !== undefined) {
            exportData['include_custom_fields'] = props['include_custom_fields'];
        }
        if (props['include_attribution'] !== undefined) {
            exportData['include_attribution'] = props['include_attribution'];
        }
        if (props['include_customer_journey']) {
            exportData['include_customer_journey'] = props['include_customer_journey'];
        }
        if (props['email_notification'] !== undefined) {
            exportData['email_notification'] = props['email_notification'];
        }
        if (props['webhook_url']) exportData['webhook_url'] = props['webhook_url'];
        const response = await whatconvertsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/exports',
            body: exportData
        });

        return response.body;
    },
});