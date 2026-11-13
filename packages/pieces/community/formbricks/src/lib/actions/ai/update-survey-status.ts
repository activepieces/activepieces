import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs, SURVEY_STATUS_CHANGE_OPTIONS } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const updateSurveyStatusAiAction = createAction({
  auth: formBricksAuth,
  name: 'update_survey_status_ai',
  classification: 'WRITE',
  displayName: 'Update Survey Status (AI)',
  description: 'Sets a Formbricks survey status by survey ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change a Formbricks survey status: paused stops new responses temporarily, completed closes the survey, inProgress resumes it. Only changes the status, nothing else on the survey. Setting the same status again is safe.',
    idempotent: true,
  },
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: true }),
    status: Property.StaticDropdown({
      displayName: 'New Status',
      required: true,
      options: { options: SURVEY_STATUS_CHANGE_OPTIONS },
    }),
  },
  outputSchema: formbricksSchemas.surveyDetail,
  async run({ auth, propsValue }) {
    return formbricksApi.updateSurveyStatus({
      auth,
      surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey ID' }),
      status: formbricksInputs.requiredString({ value: propsValue.status, label: 'New Status' }),
    });
  },
});
