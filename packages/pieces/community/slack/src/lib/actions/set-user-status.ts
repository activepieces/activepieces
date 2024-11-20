import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const setUserStatusAction = createAction({
  auth: slackAuth,
  name: 'slack-set-user-status',
  displayName: 'Set User Status',
  description: "Sets a user's custom status",
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      required: false,
      description:
        'Emoji shortname (standard or custom), e.g. :tada: or :train:',
    }),
    expiration: Property.Number({
      displayName: 'Expires at',
      description: 'Unix timestamp - if not set, the status will not expire',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      text: z.string().max(100),
    });

    const client = new WebClient(auth.data['authed_user']?.access_token);
    return await client.users.profile.set({
      profile: {
        status_text: propsValue.text,
        status_emoji: propsValue.emoji,
        status_expiration: propsValue.expiration,
      },
    });
  },
});
