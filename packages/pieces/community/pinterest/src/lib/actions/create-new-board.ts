import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestOperations } from '../common/operations';
import { createBoardActionOutputSchema } from '../output-schemas';

export const createNewBoard = createAction({
  auth: pinterestAuth,
  name: 'createNewBoard',
  classification: 'WRITE',
  outputSchema: createBoardActionOutputSchema,
  displayName: 'Create New Board',
  description: 'Create a board to organise Pins.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a board and returns its new board id, optionally with a description and a privacy level of public or protected. Use it when no suitable board exists yet; check List Boards or Search Boards first, because Pinterest allows two boards with the same name and each call creates another one, which makes this not idempotent. Secret boards are not offered because this connection does not hold the scope Pinterest requires to write them.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'Name of the board (max 180 characters).',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'Description of the board (max 500 characters).',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      defaultValue: 'PUBLIC',
      description:
        'Who can see the board. Defaults to public. Secret boards cannot be created through this connection.',
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.createBoard({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
