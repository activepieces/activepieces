import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { createBoardOperation } from '../common/operations';
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
      'Creates a board and returns its new board id, optionally with a description and a privacy level of public, protected or secret. Use it when no suitable board exists yet; check List Boards or Search Boards first, because Pinterest allows two boards with the same name and each call creates another one, which makes this not idempotent.',
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
      description: 'Who can see the board. Defaults to public.',
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Secret', value: 'SECRET' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await createBoardOperation({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
