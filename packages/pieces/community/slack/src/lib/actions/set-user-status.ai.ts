import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { setUserStatusAction } from './set-user-status';

export const slackSetUserStatus = createAction({
  auth: slackAuth,
  name: 'set_user_status',
  displayName: 'Set User Status',
  description: "Set the authenticated user's custom status text and emoji.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Sets the authenticated user's custom status text and optional emoji, with an optional Unix-timestamp expiration. Pick this to change only the status; use Update Profile to change name or email fields. Requires a user token (not a bot token); this overwrites any existing status so re-running with the same input is idempotent. Status text is capped at 100 characters.",
    idempotent: true,
  },
  props: setUserStatusAction.props,
  run: setUserStatusAction.run,
});
