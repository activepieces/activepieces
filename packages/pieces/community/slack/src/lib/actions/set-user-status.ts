import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const setUserStatusAction = createAction({
  auth: slackAuth,
  name: 'slack-set-user-status',
  displayName: 'Set User Status',
  description: "Sets a user's custom status",
  audience: 'both',
  aiMetadata: { description: "Set the authenticated user's custom status text and optional emoji, optionally with a Unix-timestamp expiration; requires a user token, not a bot token. This overwrites any existing status, so re-running with the same input is idempotent. Status text is capped at 100 characters.", idempotent: true },
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

    const client = new WebClient(requireUserToken(auth as SlackAuthValue));
    return await client.users.profile.set({
      profile: {
        status_text: propsValue.text,
        status_emoji: propsValue.emoji,
        status_expiration: propsValue.expiration,
      },
    });
  },
});
