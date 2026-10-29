import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';
import { posthogOutputSchemas } from '../../common/output-schemas';

const CHANGED_MESSAGE = 'The flag was changed in PostHog while this update ran. Run the action again.';

export const updateFeatureFlag = createAction({
  auth: posthogAuth,
  name: 'update_feature_flag',
  classification: 'WRITE',
  displayName: 'Update Feature Flag',
  description: 'Turn a flag on/off, rename it or change its rollout.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates a PostHog feature flag by numeric flag id. Only the fields you pass change: active (true/false) turns the flag on or off, name changes the description, rolloutPercentage (0-100) sets the rollout of a flag that has exactly one release condition (fails on flags with several conditions or variants, to avoid wiping them). At least one field is required. Safe to repeat with the same values.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.flag,
  props: {
    flagId: Property.ShortText({ displayName: 'Flag ID', required: true }),
    active: Property.StaticDropdown({
      displayName: 'Active',
      required: false,
      options: { options: [{ label: 'On', value: 'true' }, { label: 'Off', value: 'false' }] },
    }),
    name: Property.ShortText({ displayName: 'Description', required: false }),
    rolloutPercentage: Property.Number({ displayName: 'Rollout %', required: false }),
  },
  async run({ auth, propsValue }) {
    const flagId = posthogClient.numericId({ value: propsValue.flagId, label: 'Flag ID' });
    const active = posthogClient.parseBoolean({ value: propsValue.active, label: 'Active' });
    const name = posthogClient.optionalText(propsValue.name);
    const rollout =
      propsValue.rolloutPercentage === undefined || propsValue.rolloutPercentage === null
        ? undefined
        : posthogClient.parseInteger({ value: propsValue.rolloutPercentage, label: 'Rollout %', min: 0, max: 100, fallback: 0 });
    if (active === undefined && name === undefined && rollout === undefined) {
      throw new Error('Give at least one of Active, Description or Rollout %.');
    }
    const path = posthogClient.projectPath({ auth: auth.props, segments: ['feature_flags', flagId] });
    const patch: Record<string, unknown> = {};
    let readVersion: number | undefined;
    if (active !== undefined) patch['active'] = active;
    if (name !== undefined) patch['name'] = name;
    if (rollout !== undefined) {
      const current = posthogClient.recordOf(await posthogClient.request({ auth: auth.props, method: HttpMethod.GET, path }));
      const filters = posthogClient.recordOf(current['filters']);
      const groups = posthogClient.arrayOf(filters['groups']);
      if (groups.length !== 1 || posthogClient.isRecord(filters['multivariate'])) {
        throw new Error('Rollout % can only be changed on a flag with exactly one release condition and no variants. Edit this flag in PostHog.');
      }
      patch['filters'] = { ...filters, groups: [{ ...posthogClient.recordOf(groups[0]), rollout_percentage: rollout }] };
      readVersion = posthogClient.num(current['version']) ?? undefined;
      const latest = posthogClient.recordOf(await posthogClient.request({ auth: auth.props, method: HttpMethod.GET, path }));
      if (posthogClient.num(latest['version']) !== (readVersion ?? null) || JSON.stringify(latest['filters']) !== JSON.stringify(current['filters'])) {
        throw new Error(CHANGED_MESSAGE);
      }
      if (readVersion !== undefined) patch['version'] = readVersion;
    }
    const body = await posthogClient.request({ auth: auth.props, method: HttpMethod.PATCH, path, body: patch });
    const written = posthogClient.num(posthogClient.recordOf(body)['version']);
    if (readVersion !== undefined && written !== null && written > readVersion + 1) {
      throw new Error(`${CHANGED_MESSAGE} This update was saved over a change made at the same time; check the flag's release conditions in PostHog.`);
    }
    return posthogMappers.flag({ raw: body, auth: auth.props });
  },
});
