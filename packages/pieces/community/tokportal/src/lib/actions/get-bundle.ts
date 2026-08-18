import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const getBundle = createAction({
  auth: tokportalAuth,
  name: 'get_bundle',
  displayName: 'Get Bundle',
  description: 'Retrieves a bundle (mission) with its account and video status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one TokPortal bundle by ID, including its status, account listing and video slots. Use List Bundles to find IDs. Safe to retry.',
    idempotent: true,
  },
  props: {
    bundleId: tokportalProps.bundleId(true),
  },
  async run(context) {
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/bundles/${context.propsValue.bundleId}`,
    });
    return response.data ?? response;
  },
});
