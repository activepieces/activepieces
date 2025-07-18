import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { boardIdDropdown } from '../common/props';


export const updateBoard = createAction({
  auth: pinterestAuth,
  name: 'updateBoard',
  displayName: 'Update Board',
  description: 'Modify a board’s name, description, or visibility settings.',
  props: {
    board_id: boardIdDropdown,
    name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'The new name of the board.'
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description: 'The new description of the board.'
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
    const { board_id, name, description, privacy } = propsValue;
    const body: any = {};
    if (name) body.name = name;
    if (description) body.description = description;
    if (privacy) body.privacy = privacy.toLowerCase();
    return await makeRequest(auth.access_token as string, HttpMethod.PATCH, `/boards/${board_id}`, body);
  },
});
