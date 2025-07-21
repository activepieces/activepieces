import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../../index';
import { formIdDropdown } from '../common/props';

export const deleteEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'delete_entry',
  displayName: 'Delete Entry',
  description: 'Deletes a specified entry.',
  props: {
    formId: formIdDropdown,
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'Enter the ID of the entry to delete.',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { formId, entryId } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/forms/${formId}/entries/${entryId}`
    );
  },
});
