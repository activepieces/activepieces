import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const getSurveyAiAction = createAction({
  auth: formBricksAuth,
  name: 'get_survey_ai',
  classification: 'READ',
  displayName: 'Get Survey (AI)',
  description: 'Gets a Formbricks survey by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get a Formbricks survey by ID with its status and questions (question ID, type, plain-text headline). Use the question IDs as keys when reading or writing response answers. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: true }),
  },
  outputSchema: formbricksSchemas.surveyDetail,
  async run({ auth, propsValue }) {
    return formbricksApi.getSurvey({ auth, surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey ID' }) });
  },
});
