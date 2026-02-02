import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const createInvoice = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'create_invoice',
    displayName: 'Create Invoice',
    description: 'Creates a new payables invoice in Oracle Fusion Cloud ERP.',
    props: {
        invoiceNumber: Property.ShortText({
            displayName: 'Invoice Number',
            description: 'Unique invoice number from the supplier.',
            required: true,
        }),
        businessUnit: Property.ShortText({
            displayName: 'Business Unit',
            description: 'The business unit name for the invoice.',
            required: true,
        }),
        supplier: Property.ShortText({
            displayName: 'Supplier',
            description: 'The supplier name on the invoice.',
            required: true,
        }),
        supplierSite: Property.ShortText({
            displayName: 'Supplier Site',
            description: 'The supplier site from where goods/services are rendered.',
            required: true,
        }),
        invoiceAmount: Property.Number({
            displayName: 'Invoice Amount',
            description: 'The total invoice amount.',
            required: true,
        }),
        invoiceCurrency: Property.ShortText({
            displayName: 'Invoice Currency',
            description: 'Currency code (e.g., USD, EUR).',
            required: true,
            defaultValue: 'USD',
        }),
        paymentCurrency: Property.ShortText({
            displayName: 'Payment Currency',
            description: 'Currency used for payment.',
            required: true,
            defaultValue: 'USD',
        }),
        invoiceDate: Property.ShortText({
            displayName: 'Invoice Date',
            description: 'Invoice date in YYYY-MM-DD format.',
            required: true,
        }),
        accountingDate: Property.ShortText({
            displayName: 'Accounting Date',
            description: 'Accounting date in YYYY-MM-DD format.',
            required: true,
        }),
        termsDate: Property.ShortText({
            displayName: 'Terms Date',
            description: 'Date used with payment terms to calculate due dates (YYYY-MM-DD).',
            required: true,
        }),
        paymentMethodCode: Property.ShortText({
            displayName: 'Payment Method Code',
            description: 'Payment method code (e.g., CHECK, EFT).',
            required: true,
        }),
        paymentTerms: Property.ShortText({
            displayName: 'Payment Terms',
            description: 'Payment terms used to calculate due dates.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the invoice.',
            required: false,
        }),
        invoiceGroup: Property.ShortText({
            displayName: 'Invoice Group',
            description: 'Group name for reporting and payment purposes.',
            required: false,
        }),
        invoiceType: Property.StaticDropdown({
            displayName: 'Invoice Type',
            description: 'Type of invoice.',
            required: false,
            options: {
                options: [
                    { label: 'Standard', value: 'Standard' },
                    { label: 'Prepayment', value: 'Prepayment' },
                    { label: 'Credit Memo', value: 'Credit Memo' },
                    { label: 'Debit Memo', value: 'Debit Memo' },
                ],
            },
        }),
        requester: Property.ShortText({
            displayName: 'Requester',
            description: 'Name of the person who requested the goods or services.',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const {
            invoiceNumber,
            businessUnit,
            supplier,
            supplierSite,
            invoiceAmount,
            invoiceCurrency,
            paymentCurrency,
            invoiceDate,
            accountingDate,
            termsDate,
            paymentMethodCode,
            paymentTerms,
            description,
            invoiceGroup,
            invoiceType,
            requester,
        } = context.propsValue;

        const payload: Record<string, unknown> = {
            InvoiceNumber: invoiceNumber,
            BusinessUnit: businessUnit,
            Supplier: supplier,
            SupplierSite: supplierSite,
            InvoiceAmount: invoiceAmount,
            InvoiceCurrency: invoiceCurrency,
            PaymentCurrency: paymentCurrency,
            InvoiceDate: invoiceDate,
            AccountingDate: accountingDate,
            TermsDate: termsDate,
            PaymentMethodCode: paymentMethodCode,
        };

        if (paymentTerms) payload['PaymentTerms'] = paymentTerms;
        if (description) payload['Description'] = description;
        if (invoiceGroup) payload['InvoiceGroup'] = invoiceGroup;
        if (invoiceType) payload['InvoiceType'] = invoiceType;
        if (requester) payload['Requester'] = requester;

        const response = await client.createRecord('/invoices', payload);
        return response;
    },
});
