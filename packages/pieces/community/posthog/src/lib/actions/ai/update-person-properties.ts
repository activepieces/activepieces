import { createAction, Property } from '@activepieces/pieces-framework';
import { posthogAuth } from '../../auth';
import { captureEvent } from '../../common/capture';
import { posthogClient } from '../../common/client';
import { posthogOutputSchemas } from '../../common/output-schemas';

export const updatePersonProperties = createAction({
  auth: posthogAuth,
  name: 'update_person_properties',
  classification: 'WRITE',
  displayName: 'Update Person Properties',
  description: 'Set, set-once or remove properties on a person.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates properties of the PostHog person identified by distinct_id by sending a $set event (creates the person if the distinct ID is new). set overwrites values, setOnce only fills properties that are not set yet, unset is a list of property names to remove. At least one of the three is required. The change is applied asynchronously (seconds). Running it twice with the same values leaves the person unchanged, but records another $set event.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.personUpdated,
  props: {
    distinctId: Property.ShortText({ displayName: 'Distinct ID', required: true }),
    set: Property.Json({ displayName: 'Set', description: 'Object of properties to set, e.g. {"plan": "pro"}.', required: false }),
    setOnce: Property.Json({ displayName: 'Set Once', description: 'Object of properties to set only if missing.', required: false }),
    unset: Property.Array({ displayName: 'Unset', description: 'Property names to remove.', required: false }),
  },
  async run({ auth, propsValue }) {
    const distinctId = posthogClient.requiredText({ value: propsValue.distinctId, label: 'Distinct ID' });
    const set = posthogClient.plainObject({ value: propsValue.set, label: 'Set' });
    const setOnce = posthogClient.plainObject({ value: propsValue.setOnce, label: 'Set Once' });
    const unsetRaw: unknown = propsValue.unset;
    const unset = (Array.isArray(unsetRaw) ? unsetRaw : typeof unsetRaw === 'string' ? unsetRaw.split(',') : [])
      .map((v: unknown) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v: string) => v !== '');
    if (!set && !setOnce && unset.length === 0) {
      throw new Error('Give at least one of Set, Set Once or Unset.');
    }
    const properties: Record<string, unknown> = {};
    if (set) properties['$set'] = set;
    if (setOnce) properties['$set_once'] = setOnce;
    if (unset.length > 0) properties['$unset'] = unset;
    const result = await captureEvent({ auth: auth.props, event: '$set', distinctId, properties });
    return { distinctId, uuid: result.uuid, set: set ?? {}, setOnce: setOnce ?? {}, unset, status: result.status };
  },
});
