import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const createReceivablesInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'create_receivables_invoice',
    displayName: 'Create Receivables Invoice',
    description: 'Creates a new receivables (AR) invoice in Oracle Fusion Cloud ERP.',
    props: {
        businessUnit: Property.ShortText({
            displayName: 'Business Unit',
            description: 'The business unit under which the invoice is created.',
            required: true,
        }),
        transactionType: Property.ShortText({
            displayName: 'Transaction Type',
            description: 'The transaction type assigned to the invoice.',
            required: true,
        }),
        transactionSource: Property.ShortText({
            displayName: 'Transaction Source',
            description: 'The transaction source assigned to the invoice.',
            required: false,
        }),
        transactionNumber: Property.ShortText({
            displayName: 'Transaction Number',
            description: 'The transaction number assigned to the invoice. If not provided, it will be auto-generated.',
            required: false,
        }),
        transactionDate: Property.ShortText({
            displayName: 'Transaction Date',
            description: 'The date when the invoice was created (YYYY-MM-DD).',
            required: false,
        }),
        accountingDate: Property.ShortText({
            displayName: 'Accounting Date',
            description: 'The accounting date assigned to the invoice (YYYY-MM-DD).',
            required: false,
        }),
        billToCustomerNumber: Property.ShortText({
            displayName: 'Bill-to Customer Account Number',
            description: 'The account number of the bill-to customer.',
            required: true,
        }),
        billToCustomerName: Property.ShortText({
            displayName: 'Bill-to Customer Name',
            description: 'The name of the bill-to customer.',
            required: false,
        }),
        billToSite: Property.ShortText({
            displayName: 'Bill-to Site',
            description: 'The number that identifies the bill-to customer site.',
            required: false,
        }),
        invoiceCurrencyCode: Property.ShortText({
            displayName: 'Invoice Currency',
            description: 'The currency code of the invoice (e.g., USD, EUR).',
            required: false,
            defaultValue: 'USD',
        }),
        paymentTerms: Property.ShortText({
            displayName: 'Payment Terms',
            description: 'The payment terms assigned to the invoice.',
            required: false,
        }),
        dueDate: Property.ShortText({
            displayName: 'Due Date',
            description: 'The date when the invoice is due (YYYY-MM-DD).',
            required: false,
        }),
        purchaseOrder: Property.ShortText({
            displayName: 'PO Number',
            description: 'The purchase order number on the invoice.',
            required: false,
        }),
        comments: Property.LongText({
            displayName: 'Comments',
            description: 'Comments that accompany the invoice.',
            required: false,
        }),
        invoiceStatus: Property.StaticDropdown({
            displayName: 'Invoice Status',
            description: 'The completion status of the invoice. Must be Complete when creating.',
            required: false,
            defaultValue: 'Complete',
            options: {
                options: [
                    { label: 'Complete', value: 'Complete' },
                    { label: 'Incomplete', value: 'Incomplete' },
                ],
            },
        }),
        shipToCustomerNumber: Property.ShortText({
            displayName: 'Ship-to Customer',
            description: 'The registry identifier of the ship-to customer.',
            required: false,
        }),
        shipToCustomerName: Property.ShortText({
            displayName: 'Ship-to Customer Name',
            description: 'The name of the customer who receives the goods or services.',
            required: false,
        }),
        legalEntityIdentifier: Property.ShortText({
            displayName: 'Legal Entity Identifier',
            description: 'The unique identifier of the legal entity.',
            required: false,
        }),
        crossReference: Property.ShortText({
            displayName: 'Reference',
            description: 'The reference field default value from the transaction source.',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const {
            businessUnit,
            transactionType,
            transactionSource,
            transactionNumber,
            transactionDate,
            accountingDate,
            billToCustomerNumber,
            billToCustomerName,
            billToSite,
            invoiceCurrencyCode,
            paymentTerms,
            dueDate,
            purchaseOrder,
            comments,
            invoiceStatus,
            shipToCustomerNumber,
            shipToCustomerName,
            legalEntityIdentifier,
            crossReference,
        } = context.propsValue;

        const payload: Record<string, unknown> = {
            BusinessUnit: businessUnit,
            TransactionType: transactionType,
            BillToCustomerNumber: billToCustomerNumber,
        };

        if (transactionSource) payload['TransactionSource'] = transactionSource;
        if (transactionNumber) payload['TransactionNumber'] = transactionNumber;
        if (transactionDate) payload['TransactionDate'] = transactionDate;
        if (accountingDate) payload['AccountingDate'] = accountingDate;
        if (billToCustomerName) payload['BillToCustomerName'] = billToCustomerName;
        if (billToSite) payload['BillToSite'] = billToSite;
        if (invoiceCurrencyCode) payload['InvoiceCurrencyCode'] = invoiceCurrencyCode;
        if (paymentTerms) payload['PaymentTerms'] = paymentTerms;
        if (dueDate) payload['DueDate'] = dueDate;
        if (purchaseOrder) payload['PurchaseOrder'] = purchaseOrder;
        if (comments) payload['Comments'] = comments;
        if (invoiceStatus) payload['InvoiceStatus'] = invoiceStatus;
        if (shipToCustomerNumber) payload['ShipToCustomerNumber'] = shipToCustomerNumber;
        if (shipToCustomerName) payload['ShipToCustomerName'] = shipToCustomerName;
        if (legalEntityIdentifier) payload['LegalEntityIdentifier'] = legalEntityIdentifier;
        if (crossReference) payload['CrossReference'] = crossReference;

        const response = await client.createRecord('/receivablesInvoices', payload);
        return response;
    },
});
