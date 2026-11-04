import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs, SURVEY_STATUS_FILTER_OPTIONS } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const listSurveysAiAction = createAction({
  auth: formBricksAuth,
  name: 'list_surveys_ai',
  classification: 'SEARCH',
  displayName: 'List Surveys (AI)',
  description: 'Lists Formbricks surveys by workspace ID and status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Formbricks surveys with their IDs, status and question count. Use it to find a survey ID before reading its questions or responses. Optional workspaceId and status (draft, scheduled, inProgress, paused, completed) filters. Scans at most 1,000 surveys: truncated=true means more matches may exist (scan_limit_reached=true means the scan cap was hit). Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Only surveys from this workspace. Empty for all workspaces.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: SURVEY_STATUS_FILTER_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of surveys to return (1 to 500, default 100).',
      required: false,
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
