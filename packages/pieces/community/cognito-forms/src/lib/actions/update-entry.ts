import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../../index';
import { formFields, formIdDropdown } from '../common/props';

export const updateEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry',
  displayName: 'Update Entry',
  description: 'Update an existing entry.',
  props: {
    formId: formIdDropdown,
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry you want to update.',
    }),
    entryData: formFields,
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryId, entryData } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.PATCH,
      `/forms/${formId}/entries/${entryId}`,
      entryData
    );
  },
});
