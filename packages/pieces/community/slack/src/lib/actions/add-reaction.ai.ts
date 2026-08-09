import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { addRectionToMessageAction } from './add-reaction-to-message';

export const slackAddReaction = createAction({
  auth: slackAuth,
  name: 'slack_add_reaction',
  displayName: 'Add Reaction',
  description: 'Add an emoji reaction to a message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an emoji reaction to a specific message identified by its channel and message timestamp (obtain the timestamp from a posted message, search, or channel history; pass a channel ID, or resolve a #name first with Find Channel). Use Remove Reaction for the inverse. Provide the emoji name without colons, e.g. thumbsup. Not idempotent: re-adding the same reaction fails with an already_reacted error rather than succeeding as a no-op (the end state is the same, but a retry surfaces an error).',
    idempotent: false,
  },
  props: addRectionToMessageAction.props,
  run: addRectionToMessageAction.run,
});
