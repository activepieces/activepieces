import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addOrUpdateSubscriber = createAction({
  auth: smooveAuth,
  name: 'addOrUpdateSubscriber',
  displayName: 'Add or Update Subscriber',
  description: '',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the subscriber.',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the subscriber.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber.',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company of the subscriber.',
      required: false,
    }),

    position: Property.ShortText({
      displayName: 'Position',
      description: 'The position or job title of the subscriber.',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'The address of the subscriber.',
      required: false,
    }),
    dateOfBirth: Property.DateTime({
      displayName: 'Date of Birth',
      description: 'The date of birth of the subscriber.',
      required: false,
    }),
    operation: Property.StaticDropdown({
      displayName: 'Operation',
      description: 'Choose the contact operation type.',
      required: true,
      options: {
        options: [
          { label: 'Create', value: 'create' },
          { label: 'Update if Exists', value: 'updateIfExists' },
          { label: 'Restore if Deleted', value: 'restoreIfDeleted' },
          { label: 'Restore if Unsubscribed', value: 'restoreIfUnsubscribed' },
          { label: 'Override Nullable Value', value: 'overrideNullableValue' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {


    const { firstName, lastName, email, company, position, address, dateOfBirth, operation } = propsValue
    let endpoint = '/Contacts';
    const queryParams: string[] = [];
    if (operation === 'updateIfExists') queryParams.push('updateIfExists=true');
    if (operation === 'restoreIfDeleted') queryParams.push('restoreIfDeleted=true');
    if (operation === 'restoreIfUnsubscribed') queryParams.push('restoreIfUnsubscribed=true');
    if (operation === 'overrideNullableValue') queryParams.push('overrideNullableValue=true');
    if (queryParams.length) endpoint += '?' + queryParams.join('&');

    const body = {
      firstName, lastName, email, company, position, address, dateOfBirth
    }

    const response = await makeRequest(auth, HttpMethod.POST, endpoint, body)

    return response
  },
});
