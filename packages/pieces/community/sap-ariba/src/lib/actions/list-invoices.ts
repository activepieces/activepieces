import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const listInvoices = createAction({
    auth: sapAribaAuth,
    name: 'list_invoices',
    displayName: 'List Invoices',
    description: 'Retrieves header information of one or more invoices in Ariba Network.',
    props: {
        anId: Property.ShortText({
            displayName: 'Ariba Network ID',
            description: "Buyer/Supplier Ariba Network ID (ANID).",
            required: true,
        }),
        buyerANID: Property.ShortText({
            displayName: 'Filter: Buyer ANID',
            description: "Filter by Buyer's ANID.",
            required: false,
        }),
        supplierANID: Property.ShortText({
            displayName: 'Filter: Supplier ANID',
            description: "Filter by Supplier's ANID.",
            required: false,
        }),
        documentNumber: Property.ShortText({
            displayName: 'Filter: Document Number',
            description: 'Filter by Invoice Document Number.',
            required: false,
        }),
        documentStatus: Property.StaticDropdown({
            displayName: 'Filter: Document Status',
            description: 'Filter by processing status.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Sent', value: 'Sent' },
                    { label: 'Acknowledged', value: 'Acknowledged' },
                    { label: 'Failed', value: 'Failed' },
                    { label: 'Rejected', value: 'Rejected' },
                    { label: 'Paid', value: 'Paid' },
                    { label: 'Approved', value: 'Approved' },
                ],
            },
        }),
        routingStatus: Property.StaticDropdown({
            displayName: 'Filter: Routing Status',
            description: 'Filter by routing status.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Sent', value: 'Sent' },
                    { label: 'Acknowledged', value: 'Acknowledged' },
                    { label: 'Failed', value: 'Failed' },
                ],
            },
        }),
        startDate: Property.DateTime({
            displayName: 'Filter: Created Start Date',
            description: 'Filter by creation date (start).',
            required: false,
        }),
        endDate: Property.DateTime({
            displayName: 'Filter: Created End Date',
            description: 'Filter by creation date (end).',
            required: false,
        }),
        documentStatusUpdatedStartDate: Property.DateTime({
            displayName: 'Filter: Updated Start Date',
            description: 'Filter by status updated date (start).',
            required: false,
        }),
        documentStatusUpdatedEndDate: Property.DateTime({
            displayName: 'Filter: Updated End Date',
            description: 'Filter by status updated date (end).',
            required: false,
        }),
        documentPurpose: Property.StaticDropdown({
            displayName: 'Filter: Document Purpose',
            description: 'Filter by document purpose.',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Standard', value: 'standard' },
                    { label: 'Credit Memo', value: 'creditMemo' },
                    { label: 'Debit Memo', value: 'debitMemo' },
                ],
            },
        }),
        includeInvoiceProfile: Property.Checkbox({
            displayName: 'Include Invoice Profile',
            description: 'Display Invoice Profile related fields (e.g., Address, Tax Id).',
            required: false,
            defaultValue: false,
        }),
        top: Property.Number({
            displayName: 'Page Size',
            description: 'Number of items to return (max 100).',
            required: false,
            defaultValue: 100,
        }),
        skip: Property.Number({
            displayName: 'Offset',
            description: 'Number of items to skip.',
            required: false,
        }),
    },
    async run(context) {
        const {
            anId,
            buyerANID,
            supplierANID,
            documentNumber,
            documentStatus,
            routingStatus,
            startDate,
            endDate,
            documentStatusUpdatedStartDate,
            documentStatusUpdatedEndDate,
            documentPurpose,
            includeInvoiceProfile,
            top,
            skip,
        } = context.propsValue;

        const filters: string[] = [];
        if (buyerANID) filters.push(`buyerANID eq '${buyerANID}'`);
        if (supplierANID) filters.push(`supplierANID eq '${supplierANID}'`);
        if (documentNumber) filters.push(`documentNumber eq '${documentNumber}'`);
        if (documentStatus) filters.push(`documentStatus eq '${documentStatus}'`);
        if (routingStatus) filters.push(`routingStatus eq '${routingStatus}'`);
        if (startDate) filters.push(`startDate eq '${startDate}'`);
        if (endDate) filters.push(`endDate eq '${endDate}'`);
        if (documentStatusUpdatedStartDate) filters.push(`documentStatusUpdatedStartDate eq '${documentStatusUpdatedStartDate}'`);
        if (documentStatusUpdatedEndDate) filters.push(`documentStatusUpdatedEndDate eq '${documentStatusUpdatedEndDate}'`);
        if (documentPurpose) filters.push(`documentPurpose eq '${documentPurpose}'`);

        const queryParams: Record<string, string> = {};

        if (filters.length > 0) {
            queryParams['$filter'] = filters.join(' and ');
        }
        if (includeInvoiceProfile) {
            queryParams['includeInvoiceProfile'] = 'true';
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
            '/invoices',
            queryParams,
            undefined,
            { 'X-ARIBA-NETWORK-ID': anId }
        );

        return response;
    },
});
