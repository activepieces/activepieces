import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_voting',
  displayName: 'Delete Voting',
  description: 'Deletes a voting from an app.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one voting from a Podio app. The voting id comes from Get App Votings or Create Voting.',
    idempotent: false,
  },
  props: {
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/voting/${propsValue.votingId}` });
  },
});
