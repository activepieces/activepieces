import { createAction, Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";

export const createRecord = createAction({
    auth: insightlyAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Creates a new record in a specified Insightly object.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to create.',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'Contacts' },
                    { label: 'Lead', value: 'Leads' },
                    { label: 'Opportunity', value: 'Opportunities' },
                    { label: 'Organisation', value: 'Organisations' },
                    { label: 'Project', value: 'Projects' },
                    { label: 'Task', value: 'Tasks' },
                ],
            },
        }),
        standard_fields: Property.DynamicProperties({
            displayName: 'Fields',
            description: 'The standard fields for the record.',
            required: true,
            refreshers: ['object_type'],
            props: async (propsValue) => {
                const fields: DynamicPropsValue = {};
                const objectType = (propsValue as unknown as { object_type: string | undefined })?.object_type;
                
                if (!objectType) return fields;

                switch (objectType) {
                    case 'Contacts':
                        fields['FIRST_NAME'] = Property.ShortText({ displayName: 'First Name', required: false });
                        fields['LAST_NAME'] = Property.ShortText({ displayName: 'Last Name', required: true }); // Technically optional, but best practice
                        fields['EMAIL_ADDRESS'] = Property.ShortText({ displayName: 'Email', required: false });
                        fields['PHONE'] = Property.ShortText({ displayName: 'Phone', required: false });
                        fields['TITLE'] = Property.ShortText({ displayName: 'Title (Job Title)', required: false });
                        fields['BACKGROUND'] = Property.LongText({ displayName: 'Background', required: false });
                        break;
                    case 'Leads':
                        fields['LAST_NAME'] = Property.ShortText({ displayName: 'Last Name', required: true });
                        fields['FIRST_NAME'] = Property.ShortText({ displayName: 'First Name', required: false });
                        fields['ORGANIZATION_NAME'] = Property.ShortText({ displayName: 'Organization Name', required: false });
                        fields['EMAIL'] = Property.ShortText({ displayName: 'Email', required: false });
                        break;
                    case 'Organisations':
                        fields['ORGANISATION_NAME'] = Property.ShortText({ displayName: 'Organisation Name', required: true });
                        fields['PHONE'] = Property.ShortText({ displayName: 'Phone', required: false });
                        fields['WEBSITE'] = Property.ShortText({ displayName: 'Website', required: false });
                        break;
                    case 'Opportunities':
                        fields['OPPORTUNITY_NAME'] = Property.ShortText({ displayName: 'Opportunity Name', required: true });
                        fields['OPPORTUNITY_DETAILS'] = Property.LongText({ displayName: 'Details', required: false });
                        fields['PROBABILITY'] = Property.Number({ displayName: 'Probability (%)', required: false });
                        break;
                    case 'Projects':
                        fields['PROJECT_NAME'] = Property.ShortText({ displayName: 'Project Name', required: true });
                        fields['STATUS'] = Property.ShortText({ displayName: 'Status', required: true }); // Corrected: STATUS is required
                        fields['PROJECT_DETAILS'] = Property.LongText({ displayName: 'Details', required: false });
                        break;
                    case 'Tasks':
                        fields['TITLE'] = Property.ShortText({ displayName: 'Title', required: true });
                        fields['DETAILS'] = Property.LongText({ displayName: 'Details', required: false });
                        fields['STATUS'] = Property.ShortText({ displayName: 'Status', required: false });
                        break;
                    case 'Events':
                        fields['TITLE'] = Property.ShortText({ displayName: 'Title', required: true });
                        fields['START_DATE_UTC'] = Property.DateTime({ displayName: 'Start Date (UTC)', required: true });
                        fields['END_DATE_UTC'] = Property.DateTime({ displayName: 'End Date (UTC)', required: true });
                        fields['DETAILS'] = Property.LongText({ displayName: 'Details', required: false });
                        fields['LOCATION'] = Property.ShortText({ displayName: 'Location', required: false });
                        break;
                }
                return fields;
            }
        }),
        tags: Property.ShortText({
            displayName: "Tags",
            description: "Comma-separated list of tags to add to the record.",
            required: false,
        }),
        custom_fields: Property.Json({
            displayName: "Custom Fields",
            description: "Enter custom fields as key-value pairs (e.g., {\"API_FIELD_NAME\": \"value\"}). Find the API Field Name in Insightly's System Settings.",
            required: false,
            defaultValue: {}
        })
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type, standard_fields, custom_fields, tags } = context.propsValue;

        const client = new InsightlyClient(apiKey, pod);
        
        const payload: { [key: string]: any } = { ...standard_fields };

        if (tags) {
            payload['TAGS'] = tags.split(',').map(tag => ({ TAG_NAME: tag.trim() })).filter(t => t.TAG_NAME);
        }

        if (custom_fields && Object.keys(custom_fields).length > 0) {
            payload['CUSTOMFIELDS'] = Object.entries(custom_fields).map(([fieldName, fieldValue]) => ({
                FIELD_NAME: fieldName,
                FIELD_VALUE: fieldValue,
            }));
        }
        
        return await client.makeRequest(
            HttpMethod.POST,
            `/${object_type}`,
            undefined,
            payload
        );
    },
});