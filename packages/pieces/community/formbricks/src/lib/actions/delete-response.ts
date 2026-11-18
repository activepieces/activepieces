import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksSchemas } from '../common/schemas';

export const deleteResponseAction = createAction({
  auth: formBricksAuth,
  name: 'delete_response',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Response',
  description: 'Permanently deletes a survey response.',
  audience: 'human',
  props: {
    responseId: Property.ShortText({ displayName: 'Response ID', required: true }),
  },
  outputSchema: formbricksSchemas.deleted,
  async run({ auth, propsValue }) {
    return formbricksApi.deleteResponse({ auth, responseId: formbricksInputs.requiredString({ value: propsValue.responseId, label: 'Response ID' }) });
  },
});
