import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const getCatalogItems = createAction({
    auth: sapAribaAuth,
    name: 'get_catalog_items',
    displayName: 'Get Catalog Items',
    description: 'Get list of filtered catalog items for a specific supplier.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Realm name.',
            required: true,
        }),
        catalogName: Property.ShortText({
            displayName: 'Catalog Name',
            description: 'Name of the catalog.',
            required: true,
        }),
        supplierId: Property.ShortText({
            displayName: 'Supplier ID',
            description: 'Supplier ID domain value pair (e.g., buyersystemid:Supplier16).',
            required: true,
        }),
        select: Property.ShortText({
            displayName: 'Select Fields',
            description: 'Output fields to return, comma-separated (e.g., SupplierPartId,SupplierId,LeadTime).',
            required: true,
            defaultValue: 'SupplierPartId,SupplierId',
        }),
        rsqlfilter: Property.ShortText({
            displayName: 'RSQL Filter',
            description: 'Optional RSQL filter expression (e.g., CatalogName==JCNTechnologies).',
            required: false,
        }),
        offset: Property.Number({
            displayName: 'Offset',
            description: 'Starting position for results.',
            required: true,
            defaultValue: 1,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of items to return (default 1000).',
            required: false,
            defaultValue: 1000,
        }),
    },
    async run(context) {
        const { realm, catalogName, supplierId, select, rsqlfilter, offset, limit } = context.propsValue;

        const queryParams: Record<string, string> = {
            select,
            offset: offset.toString(),
        };

        if (rsqlfilter) {
            queryParams['rsqlfilter'] = rsqlfilter;
        }
        if (limit) {
            queryParams['limit'] = limit.toString();
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            `/catalogname/${encodeURIComponent(catalogName)}/supplierid/${encodeURIComponent(supplierId)}/items`,
            queryParams,
            undefined,
            { realm }
        );

        return response;
    },
});
