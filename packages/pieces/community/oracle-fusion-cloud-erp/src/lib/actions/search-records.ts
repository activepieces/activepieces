import { oracleFusionCloudErpAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common/client';
import { BUSINESS_OBJECT_TYPES } from '../common/constants';

export const searchRecords = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'search_records',
    displayName: 'Search Records',
    description: 'Retrieves a list of records matching the specified filter criteria.',
    props: {
        business_object: Property.StaticDropdown({
            displayName: 'Business Object',
            required: true,
            options: {
                disabled: false,
                options: BUSINESS_OBJECT_TYPES,
            },
        }),
        search_criteria: Property.Object({
            displayName: 'Search Criteria',
            description: 'Filter criteria in JSON format (e.g., {"field": "value", "status": "ACTIVE"})',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of records to return (default: 25, max: 100)',
            required: false,
            defaultValue: 25,
        }),
        offset: Property.Number({
            displayName: 'Offset',
            description: 'Number of records to skip (for pagination)',
            required: false,
            defaultValue: 0,
        }),
        order_by: Property.ShortText({
            displayName: 'Order By',
            description: 'Field to order results by (e.g., "creationDate desc" or "lastUpdateDate asc")',
            required: false,
        }),
    },
    async run(context) {
        const { business_object, search_criteria, limit, offset, order_by } = context.propsValue;

        if (!business_object) {
            throw new Error('Business Object is required. Please select a business object.');
        }

        const finalLimit = Math.min(limit || 25, 100); // Oracle API limits to 100
        const finalOffset = offset || 0;
        const finalOrderBy = order_by;

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

        const queryParams: Record<string, any> = {
            limit: finalLimit,
            offset: finalOffset,
        };

        if (finalOrderBy) {
            queryParams['orderBy'] = finalOrderBy;
        }

        const criteria = search_criteria || {};
        if (Object.keys(criteria).length > 0) {
            const queryParts: string[] = [];
            Object.entries(criteria).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (typeof value === 'string') {
                        queryParts.push(`${key}="${value}"`);
                    } else {
                        queryParts.push(`${key}=${value}`);
                    }
                }
            });
            if (queryParts.length > 0) {
                queryParams['q'] = queryParts.join(' AND ');
            }
        }

        try {
            const result = await client.searchRecords(endpoint, queryParams);
            return result;
        } catch (error) {
            throw new Error(`Failed to search records: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
