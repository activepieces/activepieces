import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const updateVendorInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'update_vendor_invoice',
  classification: 'WRITE',
  displayName: 'Update Vendor Invoice',
  description: 'Updates an existing Purchasing vendor invoice in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update top-level fields on an existing Sage Intacct Purchasing vendor invoice, identified by its system key. Does not change line items. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    vendorInvoice: sageIntacctDropdowns.vendorInvoiceByKey,
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    referenceNumber: Property.ShortText({ displayName: 'Reference Number', required: false }),
  },
  async run(context) {
    const { vendorInvoice, dueDate, referenceNumber } = context.propsValue;
    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PATCH,
      path: sageIntacctClient.documentPath({
        module: 'purchasing',
        documentName: 'Vendor Invoice',
        key: vendorInvoice,
      }),
      body: {
        ...spreadIfDefined('dueDate', dueDate ? sageIntacctClient.toDate(dueDate) : undefined),
        ...spreadIfDefined('referenceNumber', referenceNumber),
      },
    });
  },
});
