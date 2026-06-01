import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../..';
import { jungleGridCommon } from '../common';

export const listJobs = createAction({
  auth: jungleGridAuth,
  name: 'list_jobs',
  displayName: 'List Jobs',
  description: 'List Jungle Grid jobs for the authenticated workspace.',
  props: {},
  async run(context) {
    const response = await jungleGridCommon.apiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.listJobs,
    });

    return jungleGridCommon.toFlatRecords(response.body);
  },
});
