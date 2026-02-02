import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown } from '../common/props';

export const createBoard = createAction({
  auth: pinterestAuth,
  name: 'createBoard',
  displayName: 'Create Board',
  description: 'Create a new Pinterest board for organizing Pins.',
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
    const { ad_account_id, name, description, privacy, is_ads_only } =
      propsValue;
    // Validation
    if (name && name.length > 180) {
      throw new Error('Board name must be 180 characters or less');
    }

    if (description && description.length > 500) {
      throw new Error('Board description must be 500 characters or less');
    }
    const body: any = {
      name,
      is_ads_only,
    };
    if (description) body.description = description;
    if (privacy) body.privacy = privacy;

    let path = '/boards';
    if (ad_account_id) {
      path = `/boards?ad_account_id=${encodeURIComponent(ad_account_id)}`;
    }

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.POST,
      path,
      body
    );
  },
});
