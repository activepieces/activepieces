import { createAction, Property } from '@activepieces/pieces-framework';
import { waitwhileAuth } from '../common/auth';
import { visitIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteAVisit = createAction({
  auth: waitwhileAuth,
  name: 'deleteAVisit',
  displayName: 'Delete a visit',
  description:
    'Permanently remove a visit from the database. The visit will no longer be retrievable and will not be factored into analytics.',
  props: {
    visitId: visitIdDropdown,
  },
  async run(context) {
    const { visitId } = context.propsValue;
    const api_key = context.auth.secret_text;

    const response = await makeRequest(
      api_key,
      HttpMethod.DELETE,
      `/visits/${visitId}`
    );
    return response;
  },
});
