import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { listSmartEmailsOutputSchema } from '../output-schemas';

export const listSmartEmailsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'list_smart_emails',
  classification: 'SEARCH',
  displayName: 'List Smart Emails',
  description: 'Returns the smart transactional emails of a client.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the smart transactional emails (ID, name, status, creation date) of one Campaign Monitor client, filtered by status. Choose this to discover the smart email ID that Send Smart Transactional Email needs. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSmartEmailsOutputSchema,
  props: {
    clientId: clientId,
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Draft', value: 'draft' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const status = propsValue.status ?? 'active';
    const response = await makeRequest<
      {
        ID: string;
        Name: string;
        CreatedAt: string;
        Status: string;
      }[]
    >({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/transactional/smartEmail?status=${status}&clientID=${encodeURIComponent(
        propsValue.clientId
      )}`,
    });
    return response.body;
  },
});
