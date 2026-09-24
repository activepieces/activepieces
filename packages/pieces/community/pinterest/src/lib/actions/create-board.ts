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
      description: 'Up to 180 characters.',
      placeholder: 'e.g. Summer Recipes',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'Up to 500 characters.',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      defaultValue: 'PUBLIC',
      display: 'cards',
      options: {
        options: [
          {
            label: 'Public',
            value: 'PUBLIC',
            description: 'Visible to all',
          },
          {
            label: 'Protected',
            value: 'PROTECTED',
            description: 'Ads only',
          },
          {
            label: 'Secret',
            value: 'SECRET',
            description: 'Only you',
          },
        ],
      },
    }),
    is_ads_only: Property.Checkbox({
      displayName: 'Ads-Only Board',
      description:
        'Pinterest names it "Ad-only Pins" and makes it protected.',
      defaultValue: false,
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.createBoard({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
