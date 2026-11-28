import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListSignRequestsOutputSchema } from '../../../output-schemas';

export const listSignRequestsAction = createAction({
  auth: boxAuth,
  name: 'box_list_sign_requests',
  outputSchema: boxListSignRequestsOutputSchema,
  displayName: 'List Sign Requests',
  description: 'Lists the Box Sign requests the user sent or collaborates on.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the user\'s Box Sign requests with their IDs, status and signers; requests whose files or folder were deleted are left out. Senders needs Shared Requests "true". Page with Marker (next_marker). Use Get Sign Request for one request.',
    idempotent: true,
  },
  props: {
    sharedRequests: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Shared Requests',
      description: '"true" for only requests the user collaborates on but does not own. Defaults to "false".',
    }),
    senders: Property.ShortText({
      displayName: 'Senders',
      description: 'Comma-separated sender emails to filter by. Needs Shared Requests "true".',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.senders !== undefined && propsValue.sharedRequests !== 'true') {
      throw new Error('Senders needs Shared Requests set to "true".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/sign_requests',
      query: {
        shared_requests: propsValue.sharedRequests,
        senders: propsValue.senders,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
