import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { WafeqAuth, wafeqAuth } from '../common/auth';
import { wafeqApiCall, WafeqPaginatedResponse } from '../common/client';

const props = {
  relationship: Property.StaticDropdown({
    displayName: 'Type of Contact',
    description: 'Only fire on new customers, only suppliers, or both.',
    required: false,
    options: {
      options: [
        { label: 'Any', value: '' },
        { label: 'Customer only', value: 'CUSTOMER' },
        { label: 'Supplier only', value: 'SUPPLIER' },
      ],
    },
  }),
};

const polling: Polling<WafeqAuth, { relationship?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const queryParams: Record<string, string> = { page_size: '100' };
    if (lastFetchEpochMS > 0) {
      queryParams['created_ts_after'] = new Date(
        lastFetchEpochMS
      ).toISOString();
    }
    if (propsValue.relationship) {
      queryParams['relationship'] = propsValue.relationship;
    }
    const response = await wafeqApiCall<WafeqPaginatedResponse<ContactItem>>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/contacts/',
      queryParams,
    });
    return response.body.results.map((c) => ({
      epochMilliSeconds: new Date(c.created_ts).getTime(),
      data: flattenContact(c),
    }));
  },
};

export const newContact = createTrigger({
  auth: wafeqAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description:
    'Fires every time a new customer or supplier is added to your Wafeq address book. Useful for syncing new customers to HubSpot, Mailchimp, or your CRM.',
  props,
  sampleData: {
    id: 'con_xyz789',
    name: 'Acme Ltd.',
    email: 'billing@acme.com',
    phone: '+971501234567',
    country: 'AE',
    city: 'Dubai',
    tax_registration_number: '100123456700003',
    relationship: 'CUSTOMER',
    external_id: null,
    created_ts: '2024-04-24T10:15:00Z',
    modified_ts: '2024-04-24T10:15:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

function flattenContact(c: ContactItem): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    country: c.country ?? null,
    city: c.city ?? null,
    tax_registration_number: c.tax_registration_number ?? null,
    relationship: Array.isArray(c.relationship)
      ? c.relationship.join(', ')
      : null,
    external_id: c.external_id ?? null,
    created_ts: c.created_ts,
    modified_ts: c.modified_ts ?? null,
  };
}

type ContactItem = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  tax_registration_number?: string;
  relationship?: string[];
  external_id?: string;
  created_ts: string;
  modified_ts?: string;
};
