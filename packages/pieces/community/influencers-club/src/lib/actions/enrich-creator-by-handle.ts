import { createAction, Property } from '@activepieces/pieces-framework';
import { influencersClubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const enrichCreatorByHandle = createAction({
  auth: influencersClubAuth,
  name: 'enrichCreatorByHandle',
  displayName: 'Enrich Creator Social Profile by Handle',
  description: 'Enrich creator data by social media handle with full mode including all connected platforms and detailed stats',
  props: {
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'The social media handle of the creator',
      required: true,
    }),
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'The social media platform for the handle',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Instagram', value: 'instagram' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Twitter/X', value: 'twitter' },
          { label: 'Twitch', value: 'twitch' },
          { label: 'OnlyFans', value: 'onlyfans' },
        ],
      },
    }),
    include_lookalikes: Property.Checkbox({
      displayName: 'Include Lookalikes',
      description: 'Include similar creators for faster discovery (30-40% quicker). Default: true',
      required: false,
      defaultValue: true,
    }),
    email_required: Property.StaticDropdown({
      displayName: 'Email Requirement',
      description: 'Controls how to handle email availability',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Preferred (return data even if no email found)', value: 'preferred' },
          { label: 'Must Have (only return if valid email exists)', value: 'must_have' },
        ],
      },
      defaultValue: 'preferred',
    }),
  },
  async run(context) {
    const body: any = {
      handle: context.propsValue.handle,
      platform: context.propsValue.platform,
    };

    if (context.propsValue.include_lookalikes !== undefined && context.propsValue.include_lookalikes !== null) {
      body.include_lookalikes = context.propsValue.include_lookalikes;
    }

    if (context.propsValue.email_required !== undefined && context.propsValue.email_required !== null) {
      body.email_required = context.propsValue.email_required;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/creators/enrich/handle/full',
      body
    );

    return response;
  },
});
