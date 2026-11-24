import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const createFeatureFlag = createAction({
  auth: posthogAuth,
  name: 'create_feature_flag',
  classification: 'WRITE',
  displayName: 'Create Feature Flag',
  description: 'Create a boolean feature flag with a rollout percentage.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a boolean PostHog feature flag with one release condition that rolls out to rolloutPercentage (0-100, default 0) of all users. key must be unique in the project (letters, digits, - and _); a duplicate key fails with a validation error, so a retry after success does not create a second flag. active defaults to true. Returns the new flag id.',
    idempotent: false,
  },
  outputSchema: posthogOutputSchemas.flag,
  props: {
    key: Property.ShortText({ displayName: 'Key', required: true }),
    name: Property.ShortText({ displayName: 'Description', required: false }),
    rolloutPercentage: Property.Number({ displayName: 'Rollout %', required: false, defaultValue: 0 }),
    active: Property.Checkbox({ displayName: 'Active', required: false, defaultValue: true }),
  },
  async run({ auth, propsValue }) {
    const key = posthogClient.requiredText({ value: propsValue.key, label: 'Key' });
    if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error('Key may only contain letters, digits, - and _.');
    const rollout = posthogClient.parseInteger({ value: propsValue.rolloutPercentage, label: 'Rollout %', min: 0, max: 100, fallback: 0 });
    const active = posthogClient.parseBoolean({ value: propsValue.active, label: 'Active' }) ?? true;
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['feature_flags'] }),
      body: {
        key,
        name: posthogClient.optionalText(propsValue.name) ?? '',
        active,
        filters: { groups: [{ properties: [], rollout_percentage: rollout }] },
      },
    });
    return posthogMappers.flag({ raw: body, auth: auth.props });
  },
});
