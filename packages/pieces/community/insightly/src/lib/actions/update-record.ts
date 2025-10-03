import { createAction, Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { insightlyAuth } from "../common/auth";
import { InsightlyClient } from "../common/client";
import { insightlyProps } from "../common/props";

export const updateRecord = createAction({
    auth: insightlyAuth,
    name: 'update_record',
    displayName: 'Update Record',
    description: 'Update an existing record’s fields.',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
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
        record_id: insightlyProps.recordId(),
        standard_fields: Property.DynamicProperties({
            displayName: 'Fields',
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
            description: "Comma-separated list of tags. Note: This will overwrite existing tags.",
            required: false,
        }),
        custom_fields: Property.Json({
            displayName: "Custom Fields",
            description: "Enter custom fields to update as key-value pairs.",
            required: false,
            defaultValue: {}
        }),
    },

    async run(context) {
        const { apiKey, pod } = context.auth;
        const { object_type, record_id, standard_fields, custom_fields, tags } = context.propsValue;

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

        let idKey = '';
        switch(object_type) {
            case 'Contacts': idKey = 'CONTACT_ID'; break;
            case 'Leads': idKey = 'LEAD_ID'; break;
            case 'Opportunities': idKey = 'OPPORTUNITY_ID'; break; 
            case 'Organisations': idKey = 'ORGANISATION_ID'; break;
            case 'Projects': idKey = 'PROJECT_ID'; break;
            case 'Tasks': idKey = 'TASK_ID'; break;
        }
        if (idKey) {
            payload[idKey] = record_id;
        }
        
        const finalPayload: { [key: string]: any } = {};
        for (const key in payload) {
            const value = payload[key];
            if (value !== null && value !== undefined && value !== '') {
                finalPayload[key] = value;
            }
        }
        
        return await client.makeRequest(
            HttpMethod.PUT,
            `/${object_type}/${record_id}`,
            undefined,
            finalPayload
        );
    },
});