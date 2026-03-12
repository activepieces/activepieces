import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const listPurchaseOrderItems = createAction({
    auth: sapAribaAuth,
    name: 'list_purchase_order_items',
    displayName: 'List Purchase Order Line Items',
    description: 'Retrieves line item information from purchase orders for a specified buyer.',
    props: {
        buyerANID: Property.ShortText({
            displayName: 'Buyer ANID',
            description: "The buyer's Ariba Network ID.",
            required: true,
        }),
        documentNumber: Property.ShortText({
            displayName: 'Document Number',
            description: 'Filter by order ID / purchase order number.',
            required: false,
        }),
        orderStatus: Property.StaticDropdown({
            displayName: 'Order Status',
            description: 'Filter by order processing state.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'New', value: 'New' },
                    { label: 'Changed', value: 'Changed' },
                    { label: 'Confirmed', value: 'Confirmed' },
                    { label: 'Shipped', value: 'Shipped' },
                    { label: 'Invoiced', value: 'Invoiced' },
                    { label: 'Canceled', value: 'Canceled' },
                ],
            },
        }),
        routingStatus: Property.StaticDropdown({
            displayName: 'Routing Status',
            description: 'Filter by routing status.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Queued', value: 'Queued' },
                    { label: 'Sent', value: 'Sent' },
                    { label: 'Acknowledged', value: 'Acknowledged' },
                    { label: 'Failed', value: 'Failed' },
                ],
            },
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            description: 'Filter orders received on or after this date. Max range: 31 days.',
            required: false,
        }),
        endDate: Property.DateTime({
            displayName: 'End Date',
            description: 'Filter orders received on or before this date. Max range: 31 days.',
            required: false,
        }),
        top: Property.Number({
            displayName: 'Page Size',
            description: 'Number of items to return.',
            required: false,
            defaultValue: 50,
        }),
        skip: Property.Number({
            displayName: 'Offset',
            description: 'Number of items to skip.',
            required: false,
            defaultValue: 0,
        }),
    },
    async run(context) {
        const { buyerANID, documentNumber, orderStatus, routingStatus, startDate, endDate, top, skip } = context.propsValue;

        const filters: string[] = [];

        if (documentNumber) {
            filters.push(`documentNumber eq '${documentNumber}'`);
        }
        if (orderStatus) {
            filters.push(`orderStatus eq '${orderStatus}'`);
        }
        if (routingStatus) {
            filters.push(`routingStatus eq '${routingStatus}'`);
        }
        if (startDate) {
            filters.push(`startDate eq '${startDate}'`);
        }
        if (endDate) {
            filters.push(`endDate eq '${endDate}'`);
        }

        const queryParams: Record<string, string> = {};

        if (filters.length > 0) {
            queryParams['$filter'] = filters.join(' and ');
        }
        if (top) {
            queryParams['$top'] = top.toString();
        }
        if (skip) {
            queryParams['$skip'] = skip.toString();
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            '/items',
            queryParams,
            undefined,
            { 'X-ARIBA-NETWORK-ID': buyerANID }
        );

        return response;
    },
});

