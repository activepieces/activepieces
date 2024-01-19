import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { constantContactAuth } from '../../';

export const createOrUpdateContact = createAction({
  auth: constantContactAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Create or Update a contact in Constant Contact',
  props: {
    list: Property.MultiSelectDropdown({
      displayName: 'List',
      description: 'The list of the contact',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            placeholder: 'Connect to Constant Contact to see the lists',
            disabled: true,
          };
        }
        return {
          placeholder: 'Select a list',
          disabled: false,
          options: (
            await httpClient.sendRequest<{
              lists: { list_id: string; name: string }[];
            }>({
              url: 'https://api.cc.email/v3/contact_lists',
              method: HttpMethod.GET,
              authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: (auth as OAuth2PropertyValue)['access_token'],
              },
            })
          ).body.lists.map((list) => {
            return {
              value: list.list_id,
              label: list.name,
            };
          }),
        };
      },
    }),
    email_address: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the contact',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
    }),
    job_title: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the contact',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The company name of the contact',
      required: false,
    }),
    phoner_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number of the contact',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    return (
      await httpClient.sendRequest({
        url: 'https://api.cc.email/v3/contacts/sign_up_form',
        method: HttpMethod.POST,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
        body: {
          email_address: propsValue.email_address,
          first_name: propsValue.first_name,
          last_name: propsValue.last_name,
          job_title: propsValue.job_title,
          company_name: propsValue.company_name,
          phoner_number: propsValue.phoner_number,
          list_memberships: propsValue.list,
        },
      })
    ).body;
  },
});
