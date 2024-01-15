import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';
import { intercomCommon } from '../common';
import { intercomAuth } from '../..';

enum ContactRole {
  USER = 'user',
  LEAD = 'lead',
}
export const getOrCreateContact = createAction({
  auth: intercomAuth,
  description: "Get or create a contact (ie. user or lead) if it isn't found",
  displayName: 'Get or Create Contact',
  name: 'get_or_create_contact',
  props: {
    role: Property.StaticDropdown({
      displayName: 'Role',
      required: true,
      options: {
        options: [
          { label: 'User', value: ContactRole.USER },
          { label: 'Lead', value: ContactRole.LEAD },
        ],
      },
      defaultValue: ContactRole.USER,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    external_id: Property.ShortText({
      displayName: 'External Id',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: 'Avatar Url',
      required: false,
      description: 'An image URL containing the avatar of a contact',
    }),
    custom_attributes: Property.Object({
      displayName: 'Custom Attributes',
      required: false,
    }),
  },
  run: async (context) => {
    const authentication = getAccessTokenOrThrow(context.auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.intercom.io/contacts`,
        headers: intercomCommon.intercomHeaders,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: authentication as string,
        },
        body: {
          role: context.propsValue.role,
          external_id: context.propsValue.external_id,
          email: context.propsValue.email,
          name: context.propsValue.name,
          phone: context.propsValue.phone,
          avatar: context.propsValue.avatar,
          custom_attributes: context.propsValue.custom_attributes,
          signed_up_at: new Date(),
        },
      });
      return response.body;
    } catch (ex: any) {
      //check if it is failed because the user exists
      const response: HttpResponse = JSON.parse(ex.message).response;
      if (response && response.body) {
        const errors = response.body['errors'];
        if (Array.isArray(errors) && errors[0]) {
          const idFromErrorMessage = errors[0].message?.split('id=')[1];
          if (idFromErrorMessage) {
            return intercomCommon.getContact({
              userId: idFromErrorMessage,
              token: authentication,
            });
          }
        }
      }
      throw ex;
    }
  },
});
