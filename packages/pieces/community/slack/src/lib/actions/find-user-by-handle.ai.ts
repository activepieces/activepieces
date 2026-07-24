import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { findUserByHandleAction } from './find-user-by-handle';

export const slackFindUserByHandle = createAction({
  auth: slackAuth,
  name: 'find_user_by_handle',
  displayName: 'Find User by Handle',
  description: 'Find a Slack user by their handle (display name).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a workspace member by their Slack handle (display name without the leading @) and returns that user. Pick this when you only know the handle and need the user object or ID; use Find User by Email when you have an email, or Get User when you already have the ID. Scans the full member list and errors if no exact display-name match is found; read-only and idempotent.',
    idempotent: true,
  },
  props: findUserByHandleAction.props,
  run: findUserByHandleAction.run,
});
