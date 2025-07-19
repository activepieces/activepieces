import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveApiCall } from '../common/client';
import { smooveAuth } from '../common/auth';

export const createListAction = createAction({
  auth: smooveAuth,
  name: 'create-list',
  displayName: 'Create List',
  description: 'Create a new subscriber list in Smoove.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Internal name for the list.',
      required: false,
    }),
    publicName: Property.ShortText({
      displayName: 'Public Name',
      description: 'Public-facing name for the list.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Internal description of the list.',
      required: false,
    }),
    publicDescription: Property.LongText({
      displayName: 'Public Description',
      description: 'Description visible to users when subscribing.',
      required: false,
    }),
    isPublic: Property.Checkbox({
      displayName: 'Is Public',
      required: false,
      defaultValue: false,
    }),
    allowsUsersToSubscribe: Property.Checkbox({
      displayName: 'Allow Users to Subscribe',
      required: false,
      defaultValue: false,
    }),
    allowsUsersToUnsubscribe: Property.Checkbox({
      displayName: 'Allow Users to Unsubscribe',
      required: false,
      defaultValue: false,
    }),
    isPortal: Property.Checkbox({
      displayName: 'Visible in Portal',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      name,
      publicName,
      description,
      publicDescription,
      isPublic,
      allowsUsersToSubscribe,
      allowsUsersToUnsubscribe,
      isPortal,
    } = context.propsValue;

    const requestBody = {
      name,
      publicName,
      description,
      publicDescription,
      permissions: {
        isPublic,
        allowsUsersToSubscribe,
        allowsUsersToUnsubscribe,
        isPortal,
      },
    };

    try {
      const response = await smooveApiCall({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: '/Lists',
        body: requestBody,
      });

      return {
        success: true,
        message: 'List created successfully!',
        data: response,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad Request: ${error.response?.data?.message || error.message}`);
      }

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid API key. Please check your credentials.');
      }

      if (error.response?.status === 500) {
        throw new Error('Internal Server Error: Smoove encountered an issue. Try again later.');
      }

      throw new Error(`Failed to create list: ${error.message || 'Unknown error occurred'}`);
    }
  },
});
