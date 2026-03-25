import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const analyzeCall = createAction({
  auth: blandAiAuth,
  name: 'analyze_call',
  displayName: 'Analyze Call',
  description:
    'Analyze a completed call with custom questions and extract structured data from the transcript.',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call to analyze.',
      required: true,
    }),
    goal: Property.LongText({
      displayName: 'Analysis Goal',
      description:
        'What you want to learn from the call (e.g. "Did the customer agree to a meeting?").',
      required: true,
    }),
    questions: Property.Array({
      displayName: 'Questions',
      description:
        'Specific questions to answer about the call (e.g. ["Was the customer interested?", "What objections were raised?"]).',
      required: false,
    }),
  },
  async run(context) {
    const { callId, goal, questions } = context.propsValue;

    const body: Record<string, unknown> = {
      goal,
    };

    if (questions && questions.length > 0) {
      body['questions'] = questions;
    }

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/calls/${encodeURIComponent(callId)}/analyze`,
      body,
    });
  },
});
