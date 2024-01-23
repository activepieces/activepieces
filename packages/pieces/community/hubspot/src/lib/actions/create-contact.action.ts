import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { hubspotAuth } from '../../';
import { hubspotCommon } from '../common';

export const createHubspotContact = createAction({
  auth: hubspotAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Fails on duplicate email addresses',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the new contact',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the new contact',
      required: true,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      description: 'Zip code of the new contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the new contact',
      required: false,
    }),
    choose_props: hubspotCommon.choose_props,
    dynamicProperties: hubspotCommon.dynamicProperties,
  },
  async run(context) {
    const dynamicProperties = context.propsValue.dynamicProperties as Record<
      string,
      any
    >;

    const configsWithoutAuthentication: Record<string, unknown> = {
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
    };
    if (context.propsValue.zip) {
      configsWithoutAuthentication['zip'] = context.propsValue.zip;
    }
    if (context.propsValue.email) {
      configsWithoutAuthentication['email'] = context.propsValue.email;
    }
    Object.entries(dynamicProperties).forEach((f) => {
      configsWithoutAuthentication[f[0]] = f[1];
    });

    const body = {
      properties: Object.entries(configsWithoutAuthentication).map((f) => {
        return {
          property: f[0] as string,
          value: f[1],
        };
      }),
    };
    const request: HttpRequest<{
      properties: { property: string; value: any }[];
    }> = {
      method: HttpMethod.POST,
      url: 'https://api.hubapi.com/contacts/v1/contact/',
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: {},
    };
    const result = await httpClient.sendRequest(request);

    return {
      success: true,
      request_body: body,
      response_body: result.body,
    };
  },
});
