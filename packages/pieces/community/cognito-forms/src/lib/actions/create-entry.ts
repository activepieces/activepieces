import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../../index';
import { formIdDropdown } from '../common/props';

export const createEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry',
  displayName: 'Create Entry',
  description: 'Submit a new entry to a Cognito Form using the form ID and entry data.',
  props: {
    formId: formIdDropdown,
    entryData: Property.Json({
      displayName: 'Entry Data',
      required: true,
      description: 'The form field values to submit. Refer to the form schema to know what keys are required.',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryData } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/forms/${formId}/entries`,
      entryData
    );
  },
});
