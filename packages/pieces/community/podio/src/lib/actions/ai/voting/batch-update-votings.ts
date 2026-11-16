import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioBatchUpdateVotingsOutputSchema } from '../../../output-schemas';

export const batchUpdateVotingsAction = createAction({
  auth: podioAuth,
  name: 'podio_batch_update_votings',
  outputSchema: podioBatchUpdateVotingsOutputSchema,
  displayName: 'Batch Update Votings',
  description: 'Replaces the full set of votings on an app in one call.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Replaces all votings of a Podio app in one transaction: votings and answers without an id are created, those with an id are updated, any existing voting or answer left out is deleted, and list order becomes the display order. Read the current list with Get App Votings first; for a single change use Create Voting, Update Voting or the answer actions.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
    votings: podioAiProps.idList({
      required: true,
      displayName: 'Votings',
      description:
        'The complete list of votings, each an object {"voting_id"?: number, "kind": "fivestar" | "answer", "question": string, "answers"?: [{"answer_id"?: number, "text": string}]}. Existing votings and answers missing from it are deleted.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.votings.length === 0) {
      throw new Error('Votings must hold at least one voting: an empty list deletes every voting on the app. Use Delete Voting to remove votings.');
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/voting/app/${propsValue.appId}/voting`, body: propsValue.votings });
  },
});
