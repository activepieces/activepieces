import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const createResponseAction = createAction({
  auth: formBricksAuth,
  name: 'create_response',
  classification: 'WRITE',
  displayName: 'Create Response',
  description: 'Adds a response to a survey, for example to import answers collected elsewhere.',
  audience: 'human',
  aiMetadata: {
    description: 'Create a Formbricks response for a survey picked from a dropdown. Each call adds a new response.',
    idempotent: false,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: false, description: 'Narrows the survey list. Optional.' }),
    surveyId: formbricksProps.survey({ required: true }),
    data: formbricksProps.responseData({
      required: true,
      description: 'Answers keyed by question ID. Run Get Survey to see the question IDs.',
    }),
    finished: Property.Checkbox({
      displayName: 'Finished',
      description: 'Mark the response as complete.',
      required: false,
      defaultValue: true,
    }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'Link the response to this contact. Optional.', required: false }),
  },
  outputSchema: formbricksSchemas.response,
  async run({ auth, propsValue }) {
    return formbricksApi.createResponse({
      auth,
      surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey' }),
      data: formbricksInputs.answers({ value: propsValue.data, required: true }) ?? {},
      finished: propsValue.finished ?? true,
      contactId: formbricksInputs.optionalString(propsValue.contactId),
    });
  },
});
