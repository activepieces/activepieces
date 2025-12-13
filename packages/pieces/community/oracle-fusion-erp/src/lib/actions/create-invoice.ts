import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oracleFusionErpAuth } from '../../index';
import { makeOracleApiCall } from '../common';
import { OracleFusionAuth } from '../auth';

export const createInvoiceAction = createAction({
  auth: oracleFusionErpAuth,
  name: 'create_invoice',
  displayName: 'Create Payables Invoice',
  description: 'Create a new payables invoice in Oracle Fusion Cloud ERP',
  props: {
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Unique invoice number',
      required: true,
    }),
    supplierId: Property.ShortText({
      displayName: 'Supplier ID',
      description: 'The supplier identifier',
      required: true,
    }),
    invoiceAmount: Property.Number({
      displayName: 'Invoice Amount',
      description: 'Total invoice amount',
      required: true,
    }),
    invoiceDate: Property.DateTime({
      displayName: 'Invoice Date',
      description: 'Invoice date',
      required: true,
    }),
    invoiceCurrency: Property.ShortText({
      displayName: 'Invoice Currency',
      description: 'Currency code (e.g., USD, EUR)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Invoice description',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as OracleFusionAuth;
    const {
      invoiceNumber,
      supplierId,
      invoiceAmount,
      invoiceDate,
      invoiceCurrency,
      description,
    } = context.propsValue;

    const invoiceData = {
      InvoiceNumber: invoiceNumber,
      SupplierId: supplierId,
      InvoiceAmount: invoiceAmount,
      InvoiceDate: invoiceDate,
      InvoiceCurrency: invoiceCurrency,
      Description: description || '',
    };

    return await makeOracleApiCall(
      auth,
      '/payablesInvoices',
      HttpMethod.POST,
      invoiceData
    );
  },
});
