import { Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { ServiceNowClient } from "./client";
import { ServiceNowAuth } from "./auth";

export const serviceNowProps = {
    /**
     * A dynamic dropdown property that fetches and lists all tables from ServiceNow.
     */
    table_name: (required = true) => Property.Dropdown({
        displayName: 'Table',
        description: 'The table to interact with (e.g., Incident, Problem, Change Request).',
        required: required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }
            const client = new ServiceNowClient(auth as ServiceNowAuth);
            const response = await client.makeRequest<{ result: { name: string, label: string }[] }>(
                HttpMethod.GET,
                '/table/sys_db_object',
                undefined,
                {
                    sysparm_query: `label!=NULL^ORlabel!=''`,
                    sysparm_fields: 'name,label'
                }
            );

            return {
                disabled: false,
                options: response.result.map((table) => ({
                    label: table.label,
                    value: table.name,
                })),
            };
        }
    }),

    /**
     * (NEW) A searchable dropdown to find and select a specific record by its ID.
     */
    record_id: (required = true) => Property.Dropdown({
        displayName: 'Record ID',
        description: 'The ID of the record to update. Start typing to search for records by number or description.',
        required: required,
        refreshers: ['table_name'],
        options: async ({ auth, table_name, searchValue }) => {
            if (!auth || !table_name) {
                return {
                    disabled: true,
                    placeholder: 'Select a table first',
                    options: [],
                };
            }
            const client = new ServiceNowClient(auth as ServiceNowAuth);
            const query = `numberLIKE${searchValue}^ORshort_descriptionLIKE${searchValue}`;
            const response = await client.makeRequest<{ result: { sys_id: string, number: string, short_description: string }[] }>(
                HttpMethod.GET,
                `/table/${table_name as string}`,
                undefined,
                {
                    sysparm_query: query,
                    sysparm_fields: 'sys_id,number,short_description',
                    sysparm_limit: '10'
                }
            );
            return {
                disabled: false,
                options: response.result.map((record) => {
                    const label = `${record.number || ''} - ${record.short_description || ''}`.replace(/^- | -$/g, '');
                    return {
                        label: label || record.sys_id,
                        value: record.sys_id,
                    };
                }),
            };
        }
    }),

    /**
     * (NEW) A dynamic dropdown to select a field from a table for searching.
     */
    search_field_dropdown: (required = true) => Property.Dropdown({
        displayName: 'Search Field',
        description: 'The field to search for a value in.',
        required: required,
        refreshers: ['table_name'],
        options: async ({ auth, table_name }) => {
            if (!auth || !table_name) {
                return {
                    disabled: true,
                    placeholder: 'Select a table first',
                    options: [],
                };
            }
            const client = new ServiceNowClient(auth as any);
            const response = await client.makeRequest<{ result: { element: string }[] }>(
                HttpMethod.GET,
                '/table/sys_dictionary',
                undefined,
                {
                    sysparm_query: `name=${table_name}^element!=NULL`,
                    sysparm_fields: 'element'
                }
            );
            return {
                disabled: false,
                options: response.result.map((field) => ({
                    label: field.element,
                    value: field.element,
                })),
            };
        }
    }),

    /**
     * A dynamic properties property that fetches and displays fields for a selected table.
     */
    fields: () => Property.DynamicProperties({
        displayName: 'Record Fields',
        description: 'The fields and values to update.',
        required: true,
        refreshers: ['table_name'],
        props: async ({ auth, table_name }) => {
            if (!auth || !table_name) {
                return {};
            }
            const client = new ServiceNowClient(auth as ServiceNowAuth);
            const response = await client.makeRequest<{ result: { element: string, internal_type: { value: string }, read_only: boolean }[] }>(
                HttpMethod.GET,
                '/table/sys_dictionary',
                undefined,
                {
                    sysparm_query: `name=${table_name}^read_only=false^element!=NULL`,
                    sysparm_fields: 'element,internal_type,read_only'
                }
            );

            const fields: DynamicPropsValue = {};
            for (const field of response.result) {
                if (field.element.startsWith('sys_')) continue;
                const fieldType = field.internal_type.value;

                if (fieldType === 'boolean') {
                    fields[field.element] = Property.Checkbox({
                        displayName: field.element,
                        required: false,
                    });
                } else if (['integer', 'decimal', 'float'].includes(fieldType)) {
                    fields[field.element] = Property.Number({
                        displayName: field.element,
                        required: false,
                    });
                } else {
                    fields[field.element] = Property.ShortText({
                        displayName: field.element,
                        required: false,
                    });
                }
            }
            return fields;
        }
    }),

    /**
     * (NEW) A dynamic multi-select dropdown to choose which fields to return in a response.
     */
    return_fields_dropdown: (required = false) => Property.MultiSelectDropdown({
        displayName: 'Fields to Return',
        description: 'Select the fields you want to return. If left empty, all fields will be returned.',
        required: required,
        refreshers: ['table_name'],
        options: async ({ auth, table_name }) => {
            if (!auth || !table_name) {
                return {
                    disabled: true,
                    placeholder: 'Select a table first',
                    options: [],
                };
            }
            const client = new ServiceNowClient(auth as any);
            const response = await client.makeRequest<{ result: { element: string }[] }>(
                HttpMethod.GET,
                '/table/sys_dictionary',
                undefined,
                {
                    sysparm_query: `name=${table_name}^element!=NULL`,
                    sysparm_fields: 'element'
                }
            );
            return {
                disabled: false,
                options: response.result.map((field) => ({
                    label: field.element,
                    value: field.element,
                })),
            };
        }
    }),
};