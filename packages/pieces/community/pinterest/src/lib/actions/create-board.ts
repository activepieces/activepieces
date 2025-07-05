import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBoard = createAction({
  auth: pinterestAuth,
  name: 'createBoard',
  displayName: 'Create Board',
  description: 'Create a new Pinterest board for organizing Pins.',
  props: {
    name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'The name of the board.'
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'The description of the board.'
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: true,
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Secret', value: 'SECRET' }
        ]
      },
      description: 'Set the board as public or secret.'
    })
  },
  async run({ auth, propsValue }) {
    const { name, description, privacy } = propsValue;
    const body: any = {
      name,
      privacy: privacy.toLowerCase(),
    };
    if (description) body.description = description;
    return await makeRequest(auth as string, HttpMethod.POST, '/boards', body);
  },
});
