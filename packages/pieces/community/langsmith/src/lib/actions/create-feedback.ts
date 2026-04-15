import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { langsmithAuth } from '../../';
import { langsmithApiCall } from '../common';

export const createFeedbackAction = createAction({
  auth: langsmithAuth,
  name: 'create_feedback',
  displayName: 'Create Feedback',
  description: 'Add feedback (score, comment) to a run in LangSmith.',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The ID of the run to add feedback to. You can get this from the List Runs action.',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'Feedback Key',
      description: 'A label for this feedback (e.g. "correctness", "helpfulness", "user-rating").',
      required: true,
    }),
    score: Property.Number({
      displayName: 'Score',
      description: 'A numeric score for the feedback (e.g. 0 to 1, or 1 to 5).',
      required: false,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'A categorical value for the feedback (e.g. "correct", "incorrect").',
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'An optional text comment explaining the feedback.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      run_id: context.propsValue.run_id,
      key: context.propsValue.key,
    };
    if (context.propsValue.score !== undefined) {
      body['score'] = context.propsValue.score;
    }
    if (context.propsValue.value) {
      body['value'] = context.propsValue.value;
    }
    if (context.propsValue.comment) {
      body['comment'] = context.propsValue.comment;
    }
    const response = await langsmithApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/feedback',
      body,
    });
    return response.body;
  },
});