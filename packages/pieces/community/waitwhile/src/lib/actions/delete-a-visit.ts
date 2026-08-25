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
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a visit in Waitwhile by its visit id; the visit becomes unretrievable and is excluded from analytics. Use to purge a queue or appointment entry. Requires a valid visit id and is destructive: re-running on the same id will error once the visit is gone.',
    idempotent: false,
  },
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
