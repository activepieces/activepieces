import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import {
  profilePicture,
  text,
  userId,
  username,
  actions,
  mentionOriginFlow,
} from '../common/props';
import { requestAction } from '../common/request-action';

export const requestActionDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'request_action_direct_message',
  displayName: 'Request Action from A User',
  description:
    'Send a message to a user and wait until the user selects an action',
  audience: 'both',
  aiMetadata: { description: 'Send a direct message with interactive buttons to a user and pause the flow until that user clicks one of the defined actions, then resume with their choice. Use this for a human-in-the-loop decision via DM; use Request Approval in a Channel for a simple approve/disapprove gate in a channel. Sends a new message each run, so it is not idempotent.', idempotent: false },
  props: {
    userId: userId(true),
    text,
    actions,
    username,
    profilePicture,
    mentionOriginFlow,
  },
  async run(context) {
    const { userId } = context.propsValue;
    assertNotNullOrUndefined(userId, 'userId');

    return await requestAction(userId, context);
  },
});
