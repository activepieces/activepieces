import { createAction, Property } from '@activepieces/pieces-framework';
import { getEnrichmentRequest } from '../api';
import { dropcontactAuth } from '../auth';

export const getEnrichmentRequestAction = createAction({
  name: 'get-enrichment-request',
  auth: dropcontactAuth,
  displayName: 'Get Enrichment Request',
  description:
    'Retrieve the enriched contacts result for a given Dropcontact request ID.',
  props: {
    requestId: Property.ShortText({
      displayName: 'Request ID',
      description: 'The ID of the enrichment request to retrieve (returned by Enrich Contact)',
      required: true,
    }),
  },
  async run(context) {
    const response = await getEnrichmentRequest({
      auth: context.auth,
      requestId: context.propsValue.requestId,
    });

    return response;
  },
});
