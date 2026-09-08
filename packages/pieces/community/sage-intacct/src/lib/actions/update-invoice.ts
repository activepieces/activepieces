import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient, IntacctObjectReference } from '../client';
import { sageIntacctDropdowns } from '../common/dropdowns';

export const updateInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'update_invoice',
  classification: 'WRITE',
  displayName: 'Update Invoice',
  description: 'Updates an existing AR invoice in Sage Intacct.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update top-level fields on an existing Sage Intacct AR invoice, identified by its system key. Does not change line items. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    invoice: sageIntacctDropdowns.invoiceByKey,
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    referenceNumber: Property.ShortText({ displayName: 'Reference Number', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
  async run(context) {
    const { invoice, dueDate, referenceNumber, description } = context.propsValue;
    return await sageIntacctClient.apiCall<IntacctObjectReference>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PATCH,
      path: `/objects/${sageIntacctClient.objects.arInvoice}/${invoice}`,
      body: {
        ...spreadIfDefined('dueDate', dueDate ? sageIntacctClient.toDate(dueDate) : undefined),
        ...spreadIfDefined('referenceNumber', referenceNumber),
        ...spreadIfDefined('description', description),
      },
    });
  },
});
