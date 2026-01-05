import { createAction, Property } from '@activepieces/pieces-framework';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const startScan = createAction({
  auth: intruderAuth,
  name: 'startScan',
  displayName: 'Start Scan',
  description:
    'Start a new scan. Optionally specify target addresses and/or tag names. If no targets or tags are provided, the scan will run on all targets.',
  props: {
    targets: Property.Array({
      displayName: 'Target Addresses',
      description:
        'Target addresses to scan (e.g., example.com, 192.168.1.1). Leave empty to scan all targets.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag Names',
      description:
        'Tag names to filter targets. Leave empty to scan all targets.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: {
      targets?: string[];
      tags?: string[];
    } = {};

    if (propsValue.targets && propsValue.targets.length > 0) {
      body.targets = propsValue.targets as string[];
    }

    if (propsValue.tags && propsValue.tags.length > 0) {
      body.tags = propsValue.tags as string[];
    }

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/scans/',
      Object.keys(body).length > 0 ? body : undefined
    );

    return response;
  },
});
