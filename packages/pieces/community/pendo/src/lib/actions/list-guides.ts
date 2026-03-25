import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';
import { pendoRequest } from '../common/client';

export const listGuides = createAction({
  auth: pendoAuth,
  name: 'list_guides',
  displayName: 'List Guides',
  description: 'Retrieve all guides from your Pendo account.',
  props: {},
  async run(context) {
    return await pendoRequest(
      String(context.auth),
      HttpMethod.GET,
      '/guide',
    );
  },
});
