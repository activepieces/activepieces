import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../../index';
import { formIdDropdown } from '../common/props';

export const updateEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'update_entry',
  displayName: 'Update Entry',
  description: 'Update an existing form entry using the form ID and entry ID. Only the provided fields will be updated.',
  props: {
    formId: formIdDropdown,
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry you want to update.',
    }),
    updatedData: Property.Json({
      displayName: 'Updated Entry Data',
      required: true,
      description: 'The fields to update. This is a PATCH operation — only include the fields you want to change. To clear a field, set it to null or an empty array.',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryId, updatedData } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.PATCH,
      `/forms/${formId}/entries/${entryId}`,
      updatedData
    );
  },
});
