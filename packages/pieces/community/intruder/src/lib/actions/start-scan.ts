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
    target_addresses: Property.Array({
      displayName: 'Target Addresses',
      description:
        'Target addresses to scan (e.g., example.com, 192.168.1.1). Leave empty to scan all targets.',
      required: false,
    }),
    tag_names: Property.Array({
      displayName: 'Tag Names',
      description:
        'Tag names to filter targets. Leave empty to scan all targets.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: {
      target_addresses?: string[];
      tag_names?: string[];
    } = {};

    if (propsValue.target_addresses && propsValue.target_addresses.length > 0) {
      body.target_addresses = propsValue.target_addresses as string[];
    }

    if (propsValue.tag_names && propsValue.tag_names.length > 0) {
      body.tag_names = propsValue.tag_names as string[];
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
