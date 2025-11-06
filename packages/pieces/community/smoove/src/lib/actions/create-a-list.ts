import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAList = createAction({
  auth: smooveAuth, 
  name: 'createAList',
  displayName: 'Create a List',
  description: 'Create a new mailing list with custom settings and descriptions',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to be created',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Internal description of the list for your reference',
      required: false,
      defaultValue: 'This list is a list for new subscribers',
    }),
    publicName: Property.ShortText({
      displayName: 'Public Name',
      description: 'The public-facing name of the list visible to subscribers',
      required: false,
      defaultValue: 'My subscribers public name list',
    }),
    publicDescription: Property.LongText({
      displayName: 'Public Description',
      description: 'Public description of the list visible to subscribers',
      required: false,
      defaultValue: 'Public name - This list is a list for new subscribers',
    }),
    isPublic: Property.Checkbox({
      displayName: 'Is Public',
      description: 'Make this list publicly visible',
      required: true,
      defaultValue: true
    }),
    allowsUsersToSubscribe: Property.Checkbox({
      displayName: 'Allow Users to Subscribe',
      description: 'Allow users to subscribe to this list themselves',
      required: true,
      defaultValue: true
    }),
    allowsUsersToUnsubscribe: Property.Checkbox({
      displayName: 'Allow Users to Unsubscribe',
      description: 'Allow users to unsubscribe from this list themselves',
      required: true,
      defaultValue: true
    }),
    isPortal: Property.Checkbox({
      displayName: 'Is Portal',
      description: 'Enable portal access for this list',
      required: true,
      defaultValue: false
    }),
  },
  async run({ auth, propsValue }) {
    const { name, description, publicName, publicDescription, isPublic, allowsUsersToSubscribe, allowsUsersToUnsubscribe, isPortal } = propsValue

    const body = {
      name,
      description,
      publicName,
      publicDescription,
      permissions: {
        isPublic,
        allowsUsersToSubscribe,
        allowsUsersToUnsubscribe,
        isPortal
      }
    }

    const response = await makeRequest(auth, HttpMethod.POST, '/Lists', body)
    return response
  },
});
