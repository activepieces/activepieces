import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestOperations } from '../common/operations';
import { adAccountIdDropdown } from '../common/props';
import { createBoardActionOutputSchema } from '../output-schemas';

export const createBoard = createAction({
  auth: pinterestAuth,
  name: 'createBoard',
  classification: 'WRITE',
  outputSchema: createBoardActionOutputSchema,
  displayName: 'Create Board',
  description: 'Create a new Pinterest board for organizing Pins.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new Pinterest board to organize Pins, with a name and optional description and privacy level. Use before adding Pins when no suitable board exists. Each call creates a separate board even with identical input, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    ad_account_id: adAccountIdDropdown,
    name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'The name of the board (max 180 characters).',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'Optional description for your board.',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      defaultValue: 'PUBLIC',
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Secret', value: 'SECRET' },
        ],
      },
      description:
        'Board privacy setting (auto-set to "PROTECTED" for ad-only boards).',
    }),
    is_ads_only: Property.Checkbox({
      displayName: 'Ads Only Board',
      description:
        'Create an ad-only board that can only store promotional Pins. Note: Board name will become "Ad-only Pins" and privacy will be set to "PROTECTED".',
      defaultValue: false,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.createBoard({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
