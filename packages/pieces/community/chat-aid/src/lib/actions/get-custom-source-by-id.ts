import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatAidAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const getCustomSourceById = createAction({
  auth: ChatAidAuth,
  name: 'getCustomSourceById',
  displayName: 'Get Custom Source by ID',
  description: 'Retrieve single source details by ID',
  audience: 'both',
  aiMetadata: { description: 'Fetch the details of a single custom source in the Chat Aid knowledge base by its source ID. Use this to look up or verify a specific source you already have an ID for. Idempotent read-only lookup.', idempotent: true },
  props: {
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      description: 'The ID of the custom source to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const sourceId = context.propsValue.sourceId as string;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET, 
      `/external/sources/custom/${encodeURIComponent(sourceId)}`,
      undefined
    );

    return response;
  },
});
