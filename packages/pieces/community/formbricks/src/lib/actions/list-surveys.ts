import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs, SURVEY_STATUS_FILTER_OPTIONS } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const listSurveysAction = createAction({
  auth: formBricksAuth,
  name: 'list_surveys',
  classification: 'SEARCH',
  displayName: 'List Surveys',
  description: 'Lists the surveys in a workspace, optionally only those with a given status.',
  audience: 'human',
  aiMetadata: {
    description: 'List Formbricks surveys in a workspace, optionally filtered by status. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({
      required: false,
      description: 'Only list surveys from this workspace. Leave empty for every workspace the API key can access.',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only list surveys with this status.',
      required: false,
      options: { options: SURVEY_STATUS_FILTER_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of surveys to return (1 to 500).',
      required: false,
      defaultValue: 100,
    }),
  },
  outputSchema: formbricksSchemas.listSurveys,
  async run({ auth, propsValue }) {
    return formbricksApi.listSurveys({
      auth,
      workspaceId: formbricksInputs.optionalString(propsValue.workspaceId),
      status: formbricksInputs.optionalString(propsValue.status),
      limit: formbricksInputs.clampInt({ value: propsValue.limit, min: 1, max: 500, fallback: 100 }),
    });
  },
});
