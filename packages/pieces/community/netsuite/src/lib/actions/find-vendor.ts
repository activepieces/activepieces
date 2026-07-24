import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

export const findVendor = createAction({
  name: 'findVendor',
  auth: netsuiteAuth,
  displayName: 'Find Vendor',
  description: 'Finds vendors in NetSuite by email or name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches NetSuite vendors by exact email and/or partial name (company name or entity id), returning all matching records. Provide at least one of email or name. Read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Exact email to match.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Partial company name or entity id to match.',
      required: false,
    }),
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { email, name } = context.propsValue;

    const query = netsuiteRecords.buildEntitySearchQuery({
      table: 'vendor',
      email,
      name,
    });
    if (!query) {
      throw new Error('Provide at least one of Email or Name to search.');
    }

    return client.makePaginatedRequest({
      method: HttpMethod.POST,
      url: `${client.baseUrl}/services/rest/query/v1/suiteql`,
      body: { q: query },
    });
  },
});
