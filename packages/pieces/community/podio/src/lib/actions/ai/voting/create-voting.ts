import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateVotingOutputSchema } from '../../../output-schemas';

export const createVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_create_voting',
  outputSchema: podioCreateVotingOutputSchema,
  displayName: 'Create Voting',
  description: 'Adds a voting to an app, either a five-star rating or a question with answers.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a voting on a Podio app that people then vote on per item with Vote on Item: "fivestar" rates items 1 to 5, "answer" offers the given answer options. Returns the voting with its id. The app id comes from List Apps.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
    kind: podioAiProps.choice({ required: true, displayName: 'Kind', description: '"fivestar" for a 1 to 5 rating, "answer" for a choice between answers.', values: ['fivestar', 'answer'] }),
    question: podioAiProps.text({ required: true, displayName: 'Question', description: 'The question of the voting.' }),
    answers: podioAiProps.idList({ required: false, displayName: 'Answers', description: 'The answer texts, for kind "answer" only.' }),
  },
  async run({ auth, propsValue }) {
    const { appId, kind, question, answers } = propsValue;
    const hasAnswers = answers !== undefined && answers.length > 0;
    if (kind === 'fivestar' && hasAnswers) {
      throw new Error('Answers can only be set when Kind is "answer".');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/voting/app/${appId}/voting`,
      body: { kind, question, ...(hasAnswers ? { answers } : {}) },
    });
  },
});
