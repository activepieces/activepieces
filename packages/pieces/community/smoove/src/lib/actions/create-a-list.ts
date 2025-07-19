import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAList = createAction({
  auth: smooveAuth, name: 'createAList',
  displayName: 'Create a List',
  description: '',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to be created.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'This list is a list for new subscribers.',
      required: false,
      defaultValue: 'This list is a list for new subscribers',
    }),
    publicName: Property.ShortText({
      displayName: 'Public Name',
      description: 'The public name of the list.',
      required: false,
      defaultValue: 'My subscribers public name list',
    }),
    publicDescription: Property.LongText({
      displayName: 'Public Description',
      description: 'The public description of the list.',
      required: false,
      defaultValue: 'Public name - This list is a list for new subscribers',
    }),
    isPublic: Property.Checkbox({
      displayName: 'isPublic',
      required: true,
      defaultValue: true
    }),
    allowsUsersToSubscribe: Property.Checkbox({
      displayName: 'allowsUsersToSubscribe',
      required: true,
      defaultValue: true
    }),
    allowsUsersToUnsubscribe: Property.Checkbox({
      displayName: 'allowsUsersToUnsubscribe',
      required: true,
      defaultValue: true
    }),
    isPortal: Property.Checkbox({
      displayName: 'isPortal',
      required: true,
      defaultValue: true
    }),
    // permissions: Property.Object({
    //   displayName: 'Permissions',
    //   description: 'Permissions for the list.',
    //   required: true,
    //   defaultValue: {
    //     isPublic: true,
    //     allowsUsersToSubscribe: true,
    //     allowsUsersToUnsubscribe: true,
    //     isPortal: false,
    //   },
    // }),
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
