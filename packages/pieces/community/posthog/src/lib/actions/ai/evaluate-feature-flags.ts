import { createAction, Property } from '@activepieces/pieces-framework';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const evaluateFeatureFlags = createAction({
  auth: posthogAuth,
  name: 'evaluate_feature_flags',
  classification: 'READ',
  displayName: 'Evaluate Feature Flags for User',
  description: 'Check which feature flags are on for a user.',
  audience: 'ai',
  aiMetadata: {
    description: 'Evaluates every active feature flag for one distinct_id, the same way PostHog SDKs do, and returns each flag key with enabled, variant (for multivariate flags), reason and payload. Optional personProperties (object) override stored person properties for this check, e.g. {"email": "a@b.com"}. Read-only; does not record an event.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.flagEvaluation,
  props: {
    distinctId: Property.ShortText({ displayName: 'Distinct ID', required: true }),
    personProperties: Property.Json({ displayName: 'Person Properties', required: false }),
  },
  async run({ auth, propsValue }) {
    const distinctId = posthogClient.requiredText({ value: propsValue.distinctId, label: 'Distinct ID' });
    const personProperties = posthogClient.plainObject({ value: propsValue.personProperties, label: 'Person Properties' });
    const token = await posthogClient.projectToken(auth.props);
    const body = posthogClient.recordOf(
      await posthogClient.ingest({
        auth: auth.props,
        path: '/flags/',
        query: { v: '2' },
        body: { api_key: token, distinct_id: distinctId, ...(personProperties ? { person_properties: personProperties } : {}) },
      }),
    );
    const flags = Object.entries(posthogClient.recordOf(body['flags'])).map(([key, raw]) => {
      const flag = posthogClient.recordOf(raw);
      const metadata = posthogClient.recordOf(flag['metadata']);
      const reason = posthogClient.recordOf(flag['reason']);
      return {
        key,
        enabled: flag['enabled'] === true,
        variant: posthogClient.str(flag['variant']),
        reason: posthogClient.str(reason['description']) ?? posthogClient.str(reason['code']),
        payload: metadata['payload'] ?? null,
      };
    });
    return { distinctId, flags, errorsWhileComputingFlags: body['errorsWhileComputingFlags'] === true };
  },
});
