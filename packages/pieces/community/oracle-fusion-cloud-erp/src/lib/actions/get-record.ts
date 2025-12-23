import { oracleFusionCloudErpAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common/client';
import { BUSINESS_OBJECT_TYPES, BusinessObjectType } from '../common/constants';

export const getRecord = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_record',
    displayName: 'Get Record',
    description: 'Retrieves the details of a specific record by ID.',
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
            description: 'The unique identifier of the record to retrieve.',
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
    },
    async run(context) {
        const { business_object, record_id } = context.propsValue;

        if (!business_object) {
            throw new Error('Business Object is required. Please select a business object.');
        }

        if (!record_id) {
            throw new Error('Record ID is required. Please select a record to retrieve.');
        }

        const client = makeClient(context.auth);

        try {
            const { getEndpoint } = await import('../common/client');
            const endpoint = getEndpoint(business_object as BusinessObjectType, record_id as string);
            return await client.getRecord(endpoint);
        } catch (error) {
            throw new Error(`Failed to get record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
