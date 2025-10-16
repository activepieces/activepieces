import { oracleFusionCloudErpAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common/client';
import { BUSINESS_OBJECT_TYPES } from '../common/constants';

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

                const endpointMap: Record<string, string> = {
                    invoices: '/invoices',
                    purchaseOrders: '/purchaseOrders',
                    suppliers: '/suppliers',
                    customers: '/customers',
                    payments: '/payments',
                    journals: '/journals',
                    assets: '/assets',
                    purchaseRequisitions: '/purchaseRequisitions',
                    supplierSites: '/supplierSites',
                    items: '/items',
                    itemCategories: '/itemCategories',
                    projects: '/projects',
                    projectTasks: '/projectTasks',
                    projectExpenditures: '/projectExpenditures',
                    employees: '/employees',
                    positions: '/positions',
                    departments: '/departments',
                };

                const endpoint = endpointMap[business_object as string];
                if (!endpoint) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Unsupported business object',
                    };
                }

                try {
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
        record_fields: Property.Object({
            displayName: 'Record Fields',
            description: 'The fields and values to update in JSON format.',
            required: true,
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

        if (!record_fields || typeof record_fields !== 'object' || Object.keys(record_fields).length === 0) {
            throw new Error('Record Fields are required. Please provide the fields to update.');
        }

        const client = makeClient(context.auth);

        const endpointMap: Record<string, string> = {
            invoices: `/invoices/${record_id}`,
            purchaseOrders: `/purchaseOrders/${record_id}`,
            suppliers: `/suppliers/${record_id}`,
            customers: `/customers/${record_id}`,
            payments: `/payments/${record_id}`,
            journals: `/journals/${record_id}`,
            assets: `/assets/${record_id}`,
            purchaseRequisitions: `/purchaseRequisitions/${record_id}`,
            supplierSites: `/supplierSites/${record_id}`,
            items: `/items/${record_id}`,
            itemCategories: `/itemCategories/${record_id}`,
            projects: `/projects/${record_id}`,
            projectTasks: `/projectTasks/${record_id}`,
            projectExpenditures: `/projectExpenditures/${record_id}`,
            employees: `/employees/${record_id}`,
            positions: `/positions/${record_id}`,
            departments: `/departments/${record_id}`,
        };

        const endpoint = endpointMap[business_object];
        if (!endpoint) {
            throw new Error(`Unsupported business object: ${business_object}. Please select a supported business object.`);
        }

        try {
            return await client.updateRecord(endpoint, record_fields);
        } catch (error) {
            throw new Error(`Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
