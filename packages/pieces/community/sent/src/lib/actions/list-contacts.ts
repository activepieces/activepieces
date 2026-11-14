import { createAction, Property } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';
import { sentProps } from '../common/props';

export const listContacts = createAction({
  auth: sentAuth,
  name: 'list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description:
    'Get one page of contacts, optionally filtered by search, channel, or phone number.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find Sent contacts by search term, channel, or phone. Returns one page with native pagination metadata; advance page while has_more is true. Safe to retry.',
    idempotent: true,
  },
  props: {
    profile_id: sentProps.profile,
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: true,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Contacts per page, up to 100.',
      required: true,
      defaultValue: 20,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search term for filtering contacts.',
      required: false,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description:
        'Filter using the channels documented by the contacts endpoint.',
      required: false,
      options: {
        options: [
          { label: 'SMS', value: 'sms' },
          { label: 'WhatsApp', value: 'whatsapp' },
        ],
      },
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Filter by phone number, including the country code, for example +12025550123.',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) =>
    sentApi.request({
      apiKey: auth.secret_text,
      path: '/contacts',
      profileId: propsValue.profile_id,
      query: {
        page: sentProps.pageNumber({
          value: propsValue.page,
          label: 'Page',
          maximum: 2147483647,
        }),
        page_size: sentProps.pageNumber({
          value: propsValue.page_size,
          label: 'Page Size',
          maximum: 100,
        }),
        search: propsValue.search,
        channel: propsValue.channel,
        phone: propsValue.phone,
      },
    }),
});
