import { createAction } from '@activepieces/pieces-framework';
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
} from '@activepieces/pieces-common';
import { callHarvestApi } from '../common';

export const getProjects = createAction({
  name: 'get_projects', // Must be a unique across the piece, this shouldn't be changed.
  auth: harvestAuth,
  displayName: 'Get Projects',
  description: 'Fetches projects',
  props: {},
  async run(context) {
//      const { list_id } = context.propsValue;
      const response = await callHarvestApi(
        HttpMethod.GET,
        `projects`,
        getAccessTokenOrThrow(context.auth)
      );
  
      return response.body;  },
});

