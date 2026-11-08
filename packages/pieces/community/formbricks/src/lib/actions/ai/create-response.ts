import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const createResponseAiAction = createAction({
  auth: formBricksAuth,
  name: 'create_response_ai',
  classification: 'WRITE',
  displayName: 'Create Response (AI)',
  description: 'Creates a Formbricks response for a survey ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new Formbricks survey response. answers is a JSON object keyed by question ID (get IDs from Get Survey), for example {"abc123": "Very satisfied"}. Each call adds another response, so do not retry blindly.',
    idempotent: false,
  },
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: true }),
    answers: Property.Json({ displayName: 'Answers', description: 'Object keyed by question ID.', required: true }),
    finished: Property.Checkbox({ displayName: 'Finished', description: 'Default true.', required: false, defaultValue: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    language: Property.ShortText({ displayName: 'Language Code', description: 'Default "default".', required: false }),
  },
  outputSchema: formbricksSchemas.response,
  async run({ auth, propsValue }) {
    return formbricksApi.createResponse({
      auth,
      surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey ID' }),
      data: formbricksInputs.answers({ value: propsValue.answers, required: true }) ?? {},
      finished: propsValue.finished ?? true,
      contactId: formbricksInputs.optionalString(propsValue.contactId),
      language: formbricksInputs.optionalString(propsValue.language),
    });
  },
});
