import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { documergeAuth } from '../common/auth';
import { DocuMergeClient } from '../common/client';

export const createDataRouteMerge = createAction({
  auth: documergeAuth,
  name: 'create_data_route_merge',
  displayName: 'Create Data Route Merge',
  description: 'Send data to your Data Route URL',
  props: {
    routeKey: Property.ShortText({
      displayName: 'Route Key',
      description: 'The key of the data route to merge',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Field data to merge into the document',
      required: false,
    }),
  },
  async run(context) {
    const { routeKey, fields } = context.propsValue;

    if (!routeKey) {
      throw new Error('Route key is required');
    }

    const client = new DocuMergeClient(context.auth.secret_text);

    const response = await client.post<{ message: string }>(
      `/api/routes/merge/${encodeURIComponent(routeKey)}`,
      fields || {}
    );

    return response;
  },
});

