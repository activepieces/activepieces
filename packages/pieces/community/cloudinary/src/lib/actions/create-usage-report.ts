
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createUsageReport = createAction({
  auth: cloudinaryAuth,
  name: 'createUsageReport',
  displayName: 'Create Usage Report',
  description: 'Generate a report of account usage and quotas (e.g., storage, bandwidth, transformations).',
  props: {},
  async run({ auth }) {

    const path = `/usage`;
    return await makeRequest(auth, HttpMethod.DELETE, path);
  },
});
