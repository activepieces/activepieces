import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listOrgInvoicesAction = createAction({
  name: 'list_org_invoices',
  displayName: 'List Organization Invoices',
  description: 'List all invoices for your organization',
  audience: 'both',
  aiMetadata: { description: 'List billing invoices for the organization, with optional limit and offset paging. Use for org-level invoices; the per-user equivalent is the list user invoices action. Read-only and idempotent.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of invoices to return',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of invoices to skip',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/payment/invoices',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams: {
        ...(propsValue.limit && { limit: propsValue.limit.toString() }),
        ...(propsValue.offset && { offset: propsValue.offset.toString() }),
      },
    });
    return response.body;
  },
});
