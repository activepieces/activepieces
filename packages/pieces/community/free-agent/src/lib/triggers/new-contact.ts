import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freeAgentAuth } from '../../index';

const props = {
  status: Property.StaticDropdown({
    displayName: 'Contact Status',
    description: 'Filter contacts by status',
    required: false,
    options: {
      options: [
        { label: 'All Contacts', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Clients', value: 'clients' },
        { label: 'Suppliers', value: 'suppliers' },
        { label: 'Active Projects', value: 'active_projects' },
        { label: 'Completed Projects', value: 'completed_projects' },
        { label: 'Open Clients', value: 'open_clients' },
        { label: 'Open Suppliers', value: 'open_suppliers' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    defaultValue: 'all',
  }),
};

type PropsValue = {
  status?: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freeAgentAuth>,
  PropsValue
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { status } = propsValue;

    let url = 'https://api.freeagent.com/v2/contacts?';

    if (status && status !== 'all') {
      url += `view=${status}&`;
    }

    if (lastFetchEpochMS > 0) {
      const updatedSince = new Date(lastFetchEpochMS).toISOString();
      url += `updated_since=${encodeURIComponent(updatedSince)}&`;
    }

    url = url.replace(/&$/, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    const contacts = response.body['contacts'] || [];

    return contacts.map((contact: { created_at: string }) => ({
      epochMilliSeconds: new Date(contact.created_at).getTime(),
      data: contact,
    }));
  },
};

export const freeAgentNewContactTrigger = createTrigger({
  auth: freeAgentAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    url: 'https://api.freeagent.com/v2/contacts/2',
    first_name: 'test',
    last_name: 'me',
    organisation_name: 'Acme Ltd',
    email: 'test@example.com',
    billing_email: 'billing@example.com',
    phone_number: '12345678',
    mobile: '9876543210',
    address1: '11 George Street',
    address2: 'South Court',
    address3: 'Flat 6',
    town: 'London',
    region: 'Southwark',
    postcode: 'SE1 6HA',
    country: 'United Kingdom',
    contact_name_on_invoices: true,
    default_payment_terms_in_days: 30,
    locale: 'en',
    status: 'Active',
    created_at: '2011-09-14T16:00:41Z',
    updated_at: '2011-09-16T09:34:41Z',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
