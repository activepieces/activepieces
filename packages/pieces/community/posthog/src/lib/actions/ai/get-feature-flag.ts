import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const getFeatureFlag = createAction({
  auth: posthogAuth,
  name: 'get_feature_flag',
  classification: 'READ',
  displayName: 'Get Feature Flag',
  description: 'Get one feature flag by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one PostHog feature flag by numeric flag id (from Get Feature Flags): key, name (description), active, rolloutPercentage (null when the flag has several release conditions or variants), raw filters, tags and URL. Read-only.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.flag,
  props: {
    flagId: Property.ShortText({ displayName: 'Flag ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const flagId = posthogClient.numericId({ value: propsValue.flagId, label: 'Flag ID' });
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['feature_flags', flagId] }),
    });
    return posthogMappers.flag({ raw: body, auth: auth.props });
  },
});
