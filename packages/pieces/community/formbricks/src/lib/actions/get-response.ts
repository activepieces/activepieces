import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksSchemas } from '../common/schemas';

export const getResponseAction = createAction({
  auth: formBricksAuth,
  name: 'get_response',
  classification: 'READ',
  displayName: 'Get Response',
  description: 'Gets a single survey response by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get one Formbricks survey response by response ID, with its answers keyed by question ID, finished flag, contact and meta. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    responseId: Property.ShortText({
      displayName: 'Response ID',
      description: 'From a Formbricks trigger or List Responses.',
      required: true,
    }),
  },
  outputSchema: formbricksSchemas.response,
  async run({ auth, propsValue }) {
    return formbricksApi.getResponse({ auth, responseId: formbricksInputs.requiredString({ value: propsValue.responseId, label: 'Response ID' }) });
  },
});
