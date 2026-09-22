import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';
import { updateProfileActionOutputSchema } from '../output-schemas';

export const setUserStatusAction = createAction({
  auth: slackAuth,
  name: 'slack-set-user-status',
  classification: 'WRITE',
  displayName: 'Set User Status',
  description: "Sets the connected user's status. Needs a user token.",
  audience: 'human',
  aiMetadata: { description: "Set the authenticated user's custom status text and optional emoji, optionally with a Unix-timestamp expiration; requires a user token, not a bot token. This overwrites any existing status, so re-running with the same input is idempotent. Status text is capped at 100 characters.", idempotent: true },
  outputSchema: updateProfileActionOutputSchema,
  props: {
    text: Property.ShortText({
      displayName: 'Status Text',
      description: 'Up to 100 characters.',
      placeholder: 'In a meeting',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      required: false,
      description: 'Emoji name with colons.',
      placeholder: ':calendar:',
    }),
    expiration: Property.Number({
      displayName: 'Expires At',
      description: 'Unix timestamp in seconds. Empty keeps the status until cleared.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      text: z.string().check(z.maxLength(100)),
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
