import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { fetchAllLists, getApiKey, getBaseUrl, sendgridAuth } from '../common';

export const createOrUpdateContact = createAction({
  auth: sendgridAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Add or update a contact, optionally adding them to a list',
  audience: 'both',
  aiMetadata: {
    description:
      'Upserts a marketing contact in SendGrid by email, optionally adding them to one or more lists. Existing reserved and custom fields are merged, not replaced. SendGrid processes this asynchronously and returns a job_id. Idempotent — repeating the same input converges to the same contact.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact (used to match existing contacts)',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    list_ids: Property.MultiSelectDropdown<string, false, typeof sendgridAuth>({
      displayName: 'Lists',
      description: 'Lists to add the contact to',
      required: false,
      auth: sendgridAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const lists = await fetchAllLists(auth);
        return {
          disabled: false,
          options: lists.map((list) => ({ label: list.name, value: list.id })),
        };
      },
    }),
    custom_fields: Property.Object({
      displayName: 'Additional Fields',
      description:
        'Extra reserved (e.g. city, country) or custom fields as key/value pairs',
      required: false,
    }),
  },
  async run(context) {
    const { email, first_name, last_name, list_ids, custom_fields } =
      context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${getBaseUrl(context.auth)}/marketing/contacts`,
      body: {
        ...(list_ids && list_ids.length > 0 && { list_ids }),
        contacts: [
          {
            ...custom_fields,
            email,
            ...(first_name && { first_name }),
            ...(last_name && { last_name }),
          },
        ],
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(context.auth),
      },
    });

    return response.body;
  },
});
