import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

export const findCustomer = createAction({
  name: 'findCustomer',
  auth: netsuiteAuth,
  displayName: 'Find Customer',
  description: 'Finds customers in NetSuite by email, name, or external id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches NetSuite customers by exact email, partial name (company name or entity id), and/or exact external id, returning all matching records. Provide at least one filter. Read-only and safe to repeat.',
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
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Exact external id to match.',
      required: false,
    }),
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { email, name, externalId } = context.propsValue;

    const query = netsuiteRecords.buildEntitySearchQuery({
      table: 'customer',
      email,
      name,
      externalId,
    });
    if (!query) {
      throw new Error('Provide at least one of Email, Name, or External ID to search.');
    }

    return client.makePaginatedRequest({
      method: HttpMethod.POST,
      url: `${client.baseUrl}/services/rest/query/v1/suiteql`,
      body: { q: query },
    });
  },
});
