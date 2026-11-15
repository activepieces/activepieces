import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { pollOutputSchema } from '../output-schemas';

export const voteInPoll = createAction({
  auth: mastodonAuth,
  name: 'vote_in_poll',
  classification: 'WRITE',
  displayName: 'Vote in Poll',
  description: 'Cast a vote in a poll.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Casts the connected account\'s vote in a poll using 0-based option indexes (read the options with Get Poll or Get Status). Pass several indexes only when the poll allows multiple choices. A vote cannot be changed: voting again or voting in an expired poll is rejected, so do not retry. Returns the updated poll.',
    idempotent: false,
  },
  outputSchema: pollOutputSchema,
  props: {
    poll_id: Property.ShortText({
      displayName: 'Poll ID',
      description: 'ID of the poll (the poll.id field of a status). Obtain it from Get Status or a timeline.',
      required: true,
    }),
    choices: Property.Array({
      displayName: 'Choices',
      description:
        '0-based index of each option to vote for, one per item; for example 0 for the first option.',
      required: true,
    }),
  },
  async run(context) {
    const { poll_id, choices } = context.propsValue;
    const indexes = choices
      .map((choice) => (typeof choice === 'number' ? choice : Number(String(choice).trim())))
      .filter((choice) => Number.isInteger(choice) && choice >= 0);
    if (indexes.length === 0 || indexes.length !== choices.length) {
      throw new Error('Choices must be 0-based option indexes such as 0 or 1.');
    }
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/polls/${encodeURIComponent(poll_id)}/votes`,
      operation: 'Vote in Poll',
      scope: 'write:statuses',
      body: { choices: indexes },
    });
  },
});
