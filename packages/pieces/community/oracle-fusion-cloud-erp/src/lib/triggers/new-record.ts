import { oracleFusionCloudErpAuth } from '../../index';
import {
    createTrigger,
    Property,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { makeClient } from '../common/client';
import { BUSINESS_OBJECT_TYPES } from '../common/constants';

export const newRecord = createTrigger({
  auth: oracleFusionCloudErpAuth,
  name: 'new_record',
  displayName: 'New Record',
    description: 'Triggers when a new record is created in the specified business object.',
    props: {
        business_object: Property.StaticDropdown({
            displayName: 'Business Object',
            required: true,
            options: {
                disabled: false,
                options: BUSINESS_OBJECT_TYPES,
            },
        }),
        polling_interval: Property.Number({
            displayName: 'Polling Interval (minutes)',
            description: 'How often to check for new records (minimum: 5 minutes)',
            required: false,
            defaultValue: 15,
        }),
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: '12345',
        name: 'Sample Record',
        creationDate: '2024-01-01T00:00:00Z',
        lastUpdateDate: '2024-01-01T00:00:00Z',
    },

    async onEnable(context) {
        // Store the last check timestamp
        const lastCheckTime = new Date().toISOString();
        context.store?.put('lastCheckTime', lastCheckTime);
    },

    async onDisable(context) {
        // Clean up if needed
        await context.store?.delete('lastCheckTime');
    },

    async run(context) {
        const { business_object, polling_interval } = context.propsValue;

        if (!business_object) {
            throw new Error('Business Object is required. Please select a business object.');
        }

        const finalPollingInterval = Math.max(polling_interval || 15, 5); // Minimum 5 minutes

        const client = makeClient(context.auth);

        // Get the last check time from storage
        const lastCheckTime = await context.store?.get('lastCheckTime') as string;
        const now = new Date();

        const checkFromTime = lastCheckTime
            ? new Date(new Date(lastCheckTime).getTime() - (finalPollingInterval * 60 * 1000))
            : new Date(now.getTime() - (finalPollingInterval * 60 * 1000));

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
            const searchParams: Record<string, any> = {
                limit: 100,
                orderBy: 'CreationDate desc',
            };

            if (lastCheckTime) {
                searchParams['q'] = `CreationDate > "${checkFromTime.toISOString()}"`;
            }

            const result = await client.searchRecords(endpoint, searchParams);

            await context.store?.put('lastCheckTime', now.toISOString());

            const newRecords = result.items || [];

            return newRecords.map(record => ({
                ...record,
                businessObject: business_object,
                detectedAt: now.toISOString(),
            }));

        } catch (error) {
            console.error('Error polling for new records:', error);
            return [];
        }
    },
});
