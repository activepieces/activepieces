import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const listResponsesAction = createAction({
  auth: formBricksAuth,
  name: 'list_responses',
  classification: 'SEARCH',
  displayName: 'List Responses',
  description: 'Lists survey responses, newest first, with optional survey and date filters.',
  audience: 'human',
  aiMetadata: {
    description: 'List Formbricks responses for a survey picked from a dropdown, with date filters. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: false, description: 'Narrows the survey list. Optional.' }),
    surveyId: formbricksProps.survey({ required: false, description: 'Only list responses to this survey. Leave empty for all surveys.' }),
    startDate: Property.DateTime({ displayName: 'From', description: 'Only responses created on or after this date.', required: false }),
    endDate: Property.DateTime({ displayName: 'To', description: 'Only responses created on or before this date.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Responses per page (1 to 250).', required: false, defaultValue: 50 }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of responses to skip, for paging.', required: false, defaultValue: 0 }),
  },
  outputSchema: formbricksSchemas.listResponses,
  async run({ auth, propsValue }) {
    return formbricksApi.listResponses({
      auth,
      surveyId: formbricksInputs.optionalString(propsValue.surveyId),
      startDate: formbricksInputs.optionalDate({ value: propsValue.startDate, label: 'From' }),
      endDate: formbricksInputs.optionalDate({ value: propsValue.endDate, label: 'To' }),
      limit: formbricksInputs.clampInt({ value: propsValue.limit, min: 1, max: 250, fallback: 50 }),
      skip: formbricksInputs.clampInt({ value: propsValue.skip, min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
    });
  },
});
