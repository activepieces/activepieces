import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const removeVoteAction = createAction({
  auth: podioAuth,
  name: 'podio_remove_vote',
  displayName: 'Remove Vote',
  description: 'Removes the connected user\'s vote on an item in a voting.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the connected user\'s own vote on one Podio item in one voting; Vote on Item casts it again. The item id comes from Filter Items and the voting id from Get App Votings.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/voting/item/${propsValue.itemId}/voting/${propsValue.votingId}/votes` });
  },
});
