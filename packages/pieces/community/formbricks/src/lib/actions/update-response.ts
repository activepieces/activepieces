import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksSchemas } from '../common/schemas';

export const updateResponseAction = createAction({
  auth: formBricksAuth,
  name: 'update_response',
  classification: 'WRITE',
  displayName: 'Update Response',
  description: 'Changes answers on a response or marks it finished.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update a Formbricks response by response ID: set answers (object keyed by question ID) and/or the finished flag. Only the fields you pass change. Repeating the same update is safe.',
    idempotent: true,
  },
  props: {
    responseId: Property.ShortText({ displayName: 'Response ID', required: true }),
    data: Property.Json({
      displayName: 'Answers',
      description: 'Answers keyed by question ID. Leave empty to keep them.',
      required: false,
    }),
    finished: Property.StaticDropdown({
      displayName: 'Finished',
      description: 'Leave empty to keep the current value.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
  },
  outputSchema: formbricksSchemas.response,
  async run({ auth, propsValue }) {
    const finished = formbricksInputs.optionalString(propsValue.finished);
    return formbricksApi.updateResponse({
      auth,
      responseId: formbricksInputs.requiredString({ value: propsValue.responseId, label: 'Response ID' }),
      data: formbricksInputs.answers({ value: propsValue.data, required: false }),
      finished: finished === undefined ? undefined : finished === 'true',
    });
  },
});
