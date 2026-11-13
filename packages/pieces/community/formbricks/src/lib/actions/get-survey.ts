import { createAction } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const getSurveyAction = createAction({
  auth: formBricksAuth,
  name: 'get_survey',
  classification: 'READ',
  displayName: 'Get Survey',
  description: 'Gets a survey with its questions and their IDs.',
  audience: 'human',
  aiMetadata: {
    description: 'Get one Formbricks survey picked from a dropdown, with its questions. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: false, description: 'Narrows the survey list. Optional.' }),
    surveyId: formbricksProps.survey({ required: true }),
  },
  outputSchema: formbricksSchemas.surveyDetail,
  async run({ auth, propsValue }) {
    return formbricksApi.getSurvey({ auth, surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey' }) });
  },
});
