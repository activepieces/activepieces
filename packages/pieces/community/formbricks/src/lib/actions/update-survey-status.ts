import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs, SURVEY_STATUS_CHANGE_OPTIONS } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const updateSurveyStatusAction = createAction({
  auth: formBricksAuth,
  name: 'update_survey_status',
  classification: 'WRITE',
  displayName: 'Update Survey Status',
  description: 'Pauses, resumes or completes a survey.',
  audience: 'human',
  aiMetadata: {
    description: 'Set a Formbricks survey picked from a dropdown to inProgress, paused or completed. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: false, description: 'Narrows the survey list. Optional.' }),
    surveyId: formbricksProps.survey({ required: true }),
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
      surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey' }),
      status: formbricksInputs.requiredString({ value: propsValue.status, label: 'New Status' }),
    });
  },
});
