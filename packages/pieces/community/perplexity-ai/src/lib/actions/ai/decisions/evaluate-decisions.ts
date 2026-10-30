import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { perplexityAiAuth } from '../../../auth';
import { perplexityAiClient } from '../../../common/client';
import { perplexityAiEvaluateDecisionsOutputSchema } from '../../../output-schemas';

const MODELS = [
  'pplx-decider-flash-v1.2',
  'pplx-decider-v1.2',
  'pplx-decider-flash-latest',
  'pplx-decider-latest',
];

export const evaluateDecisionsAction = createAction({
  auth: perplexityAiAuth,
  name: 'perplexity_ai_evaluate_decisions',
  outputSchema: perplexityAiEvaluateDecisionsOutputSchema,
  displayName: 'Evaluate Decisions',
  description:
    'Answer named yes/no, choice and score questions about some content.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Answers 1-128 named questions about one piece of content in a single call: "noul" (yes/no), "choice" (pick an option) and "score" (pick a level) questions, each returned under its own name with probabilities. Pick it for classification, moderation or grading; use Create Agent Response for open-ended answers. Set exactly one of Content Text or Content JSON; content plus any one question must fit in 256K tokens.',
    idempotent: true,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        '"pplx-decider-flash-v1.2" (cheaper) or "pplx-decider-v1.2" (more accurate), or a -latest alias.',
      required: true,
      defaultValue: 'pplx-decider-flash-v1.2',
      options: {
        disabled: false,
        options: MODELS.map((value) => ({ label: value, value })),
      },
    }),
    stateText: Property.LongText({
      displayName: 'Content Text',
      description:
        'The text every question refers to. Set this or Content JSON.',
      required: false,
    }),
    state: Property.Json({
      displayName: 'Content JSON',
      description:
        'The content every question refers to as an object or array; may hold OpenAI-style image_url parts with base64 data URLs. Set this or Content Text.',
      required: false,
    }),
    questions: Property.Json({
      displayName: 'Questions',
      description:
        'Object of questions keyed by a name you choose, e.g. {"defect":{"type":"noul","instructions":"Does the review report a defect?"},"sentiment":{"type":"choice","instructions":"Overall sentiment?","criteria":{"positive":null,"negative":null}},"severity":{"type":"score","instructions":"How severe?","criteria":["none","minor","major"]}}.',
      required: true,
    }),
  },
  async run(context) {
    const { model, stateText, state, questions } = context.propsValue;
    const hasJson =
      state !== undefined && state !== null && Object.keys(state).length > 0;
    if ((stateText === undefined) === !hasJson) {
      throw new Error(
        'Set exactly one of Content Text (stateText) or Content JSON (state).'
      );
    }
    return await perplexityAiClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/decisions',
      body: { model, state: hasJson ? state : stateText, questions },
    });
  },
});
