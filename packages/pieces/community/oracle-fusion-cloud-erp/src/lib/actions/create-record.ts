import { oracleFusionCloudErpAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common/client';
import { BUSINESS_OBJECT_TYPES } from '../common/constants';

export const createRecord = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Creates a new record in the specified business object.',
    props: {
        business_object: Property.StaticDropdown({
            displayName: 'Business Object',
            required: true,
            options: {
                disabled: false,
                options: BUSINESS_OBJECT_TYPES,
            },
        }),
        record_fields: Property.Object({
            displayName: 'Record Fields',
            description: 'The fields and values for the new record in JSON format.',
            required: true,
        }),
    },
    async run(context) {
        const { business_object, record_fields } = context.propsValue;

        if (!business_object) {
            throw new Error('Business Object is required. Please select a business object.');
        }

        if (!record_fields || typeof record_fields !== 'object' || Object.keys(record_fields).length === 0) {
            throw new Error('Record Fields are required. Please provide the fields for the new record.');
        }

        const client = makeClient(context.auth);

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

        const endpoint = endpointMap[business_object];
        if (!endpoint) {
            throw new Error(`Unsupported business object: ${business_object}. Please select a supported business object.`);
        }

        try {
            return await client.createRecord(endpoint, record_fields);
        } catch (error) {
            throw new Error(`Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
