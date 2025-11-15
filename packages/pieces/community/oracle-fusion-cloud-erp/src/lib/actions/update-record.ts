import { oracleFusionCloudErpAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common/client';
import { BUSINESS_OBJECT_TYPES, BusinessObjectType } from '../common/constants';
import { getFieldsForObjectType } from '../common/dynamic-fields';

export const updateRecord = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'update_record',
    displayName: 'Update Record',
    description: 'Updates an existing record in the specified business object.',
    props: {
        business_object: Property.StaticDropdown({
            displayName: 'Business Object',
            required: true,
            options: {
                disabled: false,
                options: BUSINESS_OBJECT_TYPES,
            },
        }),
        record_id: Property.Dropdown({
            displayName: 'Record ID',
            description: 'The unique identifier of the record to update.',
            required: true,
            refreshers: ['business_object'],
            options: async ({ auth, business_object }) => {
                if (!auth || !business_object) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a business object first',
                    };
                }

                const client = makeClient(auth as any);

                try {
                    const { getEndpoint } = await import('../common/client');
                    const endpoint = getEndpoint(business_object as BusinessObjectType);
                    const result = await client.searchRecords(endpoint, {
                        limit: 50,
                        orderBy: 'lastUpdateDate desc',
                    });

                    const options = (result.items || []).map((item: any) => ({
                        label: `${item.id || item.name || item.number || 'Unknown'} (${item.id})`,
                        value: item.id,
                    }));

                    return {
                        disabled: false,
                        options,
                    };
                } catch (error) {
                    console.error('Error fetching records:', error);
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading records',
                    };
                }
            },
        }),
        record_fields: Property.DynamicProperties({
            displayName: 'Record Fields',
            description: 'The fields to update',
            required: true,
            refreshers: ['business_object'],
            props: async ({ business_object }) => {
                if (!business_object) {
                    return {};
                }
                return getFieldsForObjectType(business_object as unknown as BusinessObjectType);
            },
        }),
    },
    async run(context) {
        const { business_object, record_id, record_fields } = context.propsValue;

        if (!business_object) {
            throw new Error('Business Object is required. Please select a business object.');
        }

        if (!record_id) {
            throw new Error('Record ID is required. Please select a record to update.');
        }

        if (!record_fields || typeof record_fields !== 'object') {
            throw new Error('Record Fields are required. Please provide the fields to update.');
        }

        const filteredFields: Record<string, any> = {};
        Object.entries(record_fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (key === 'custom_field' && typeof value === 'object') {
                    Object.assign(filteredFields, value);
                } else {
                    filteredFields[key] = value;
                }
            }
        });

        if (Object.keys(filteredFields).length === 0) {
            throw new Error('At least one field must be provided to update a record.');
        }

        const client = makeClient(context.auth);

        try {
            const { getEndpoint } = await import('../common/client');
            const endpoint = getEndpoint(business_object as unknown as BusinessObjectType, record_id as string);
            return await client.updateRecord(endpoint, filteredFields);
        } catch (error) {
            throw new Error(`Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
