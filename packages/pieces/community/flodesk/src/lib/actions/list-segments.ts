import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall } from '../common';

export const listSegmentsAction = createAction({
  auth: flodeskAuth,
  name: 'list_segments',
  displayName: 'List Segments',
  description: 'Retrieve a list of all segments in your Flodesk account.',
  props: {},
  async run(context) {
    const response = await flodeskApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/segments',
    });

    return response;
  },
});
