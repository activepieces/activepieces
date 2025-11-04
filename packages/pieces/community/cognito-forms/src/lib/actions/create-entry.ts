import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../../index';
import { formFields, formIdDropdown } from '../common/props';

export const createEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'create_entry',
  displayName: 'Create Entry',
  description: 'Creates a new entry.',
  props: {
    formId: formIdDropdown,
    entryData: formFields,
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
