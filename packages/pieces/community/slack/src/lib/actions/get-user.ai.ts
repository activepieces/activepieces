import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { findUserByIdAction } from './find-user-by-id';

export const slackGetUser = createAction({
  auth: slackAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Get a Slack user profile by their user ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a user profile directly by their Slack user ID. Pick this when you already have the user ID (the fastest, exact lookup); use Find User by Email or Find User by Handle to resolve an email or @handle into an ID first. Read-only and idempotent.',
    idempotent: true,
  },
  props: findUserByIdAction.props,
  run: findUserByIdAction.run,
});
