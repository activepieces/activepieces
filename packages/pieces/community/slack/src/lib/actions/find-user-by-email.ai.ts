import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { findUserByEmailAction } from './find-user-by-email';

export const slackFindUserByEmail = createAction({
  auth: slackAuth,
  name: 'find_user_by_email',
  displayName: 'Find User by Email',
  description: 'Find a Slack user by their exact email address.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a single workspace member by their exact email address and returns that user (including their user ID). Pick this to turn an email into a Slack user ID before messaging or referencing the person; use Find User by Handle when you only know the @handle, or Get User when you already have the ID. Read-only and idempotent; errors if no member matches the email.',
    idempotent: true,
  },
  props: findUserByEmailAction.props,
  run: findUserByEmailAction.run,
});
