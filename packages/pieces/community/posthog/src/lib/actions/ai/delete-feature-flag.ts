import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const deleteFeatureFlag = createAction({
  auth: posthogAuth,
  name: 'delete_feature_flag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Feature Flag',
  description: 'Delete a feature flag by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes a PostHog feature flag by numeric flag id (PostHog marks it deleted; it stops being served to users immediately and disappears from lists). Code that checks the flag key will get false. Repeating it on an already-deleted flag returns not found.',
    idempotent: false,
  },
  outputSchema: posthogOutputSchemas.deleted,
  props: {
    flagId: Property.ShortText({ displayName: 'Flag ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const flagId = posthogClient.numericId({ value: propsValue.flagId, label: 'Flag ID' });
    await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.PATCH,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['feature_flags', flagId] }),
      body: { deleted: true },
    });
    return { id: flagId, deleted: true };
  },
});
