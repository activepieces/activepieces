import { slackAuth } from '../../';
import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';

export const setUserStatusAction = createAction({
  auth: slackAuth,
  name: 'slack-set-user-status',
  displayName: 'Set User Status',
  description: "Sets a user's custom status",
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
      validators: [Validators.maxLength(100)],
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
