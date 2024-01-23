import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { pipedriveAuth } from '../../..';

export const addPerson = createAction({
  auth: pipedriveAuth,
  name: 'add_person',
  displayName: 'Add Person',
  description: 'Add a new person to the account',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: undefined,
      required: true,
    }),
    owner_id: Property.Dropdown<string>({
      displayName: 'Owner',
      refreshers: [],
      description: "The user who owns this Person's record",
      required: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account',
          };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const users = (await getUsers(authProp)).users;
        return {
          disabled: false,
          options: users.map((u) => {
            return {
              label: u.name,
              value: u.id,
            };
          }),
        };
      },
    }),
    org_id: Property.Dropdown<string>({
      displayName: 'Organization',
      refreshers: [],
      description: 'The Org of this Person',
      required: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account',
          };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const orgs = (await getOrganizations(authProp)).orgs;
        return {
          disabled: false,
          options: orgs.map((o) => {
            return {
              label: o.name,
              value: o.id,
            };
          }),
        };
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: undefined,
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: undefined,
      required: false,
    }),
    marketing_status: Property.StaticDropdown<string>({
      displayName: 'Marketing Status',
      description: 'Marketing opt-in status',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'No Consent',
            value: 'no_consent',
          },
          {
            label: 'Unsubscribed',
            value: 'unsubscribed',
          },
          {
            label: 'Subscribed',
            value: 'subscribed',
          },
          {
            label: 'Archived',
            value: 'archived',
          },
        ],
      },
    }),
  },
  async run(context) {
    const configsWithoutAuthentication = {
      name: context.propsValue.name,
      owner_id: context.propsValue.owner_id,
      org_id: context.propsValue.org_id,
      phone: context.propsValue.phone,
      email: context.propsValue.email,
      marketing_status: context.propsValue.marketing_status,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${context.auth.data['api_domain']}/api/v1/persons`,
      body: configsWithoutAuthentication,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: {},
    };

    const result = await httpClient.sendRequest(request);

    if (result.body?.['success']) {
      return result.body?.['data'];
    } else {
      return result;
    }
  },
});
async function getUsers(
  authProp: OAuth2PropertyValue
): Promise<{ users: PipedriveUser[] }> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${authProp.data['api_domain']}/api/v1/users`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
    queryParams: {},
  };

  const result = await httpClient.sendRequest(request);

  return {
    users:
      result.body['success'] && result.body['data'] != null
        ? result.body['data']
        : <PipedriveUser[]>[],
  };
}

async function getOrganizations(
  authProp: OAuth2PropertyValue
): Promise<{ orgs: PipedriveOrganization[] }> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${authProp.data['api_domain']}/api/v1/organizations`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
    queryParams: {
      limit: '500', // max limit is 500 (API restriction)
    },
  };

  const result = await httpClient.sendRequest(request);

  return {
    orgs:
      result.body['success'] && result.body['data'] != null
        ? result.body['data']
        : <PipedriveOrganization[]>[],
  };
}

interface PipedriveUser {
  id: string;
  name: string;
}

interface PipedriveOrganization {
  id: string;
  name: string;
}
