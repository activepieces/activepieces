import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { isoDateOrUndefined, numericId, patchRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const pauseSubscription = createAction({
  auth: lemonSqueezyAuth,
  name: 'pause_subscription',
  displayName: 'Pause Subscription',
  description: 'Pause payment collection for a subscription.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Pauses payment collection on a Lemon Squeezy subscription. Mode "void" stops access while paused; mode "free" keeps access for free. Optional resume date (ISO 8601); without it the pause lasts until Unpause Subscription. Idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.subscription),
  props: {
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The numeric ID of the subscription.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Pause Mode',
      description: 'Void stops access while paused; Free keeps access without paying.',
      required: true,
      defaultValue: 'void',
      options: { options: [{ label: 'Void (no access)', value: 'void' }, { label: 'Free (keep access)', value: 'free' }] },
    }),
    resumesAt: Property.ShortText({
      displayName: 'Resumes At',
      description: 'Auto-resume date (ISO 8601). Empty keeps it paused until unpaused.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    if (propsValue.mode !== 'void' && propsValue.mode !== 'free') throw new Error('Pause Mode must be "void" or "free".');
    const resumesAt = isoDateOrUndefined({ value: propsValue.resumesAt, label: 'Resumes At' });
    const id = numericId({ value: propsValue.subscriptionId, label: 'Subscription ID' });
    return patchRecord({ apiKey: auth.secret_text, type: 'subscriptions', path: `/subscriptions/${seg({ value: id, label: 'Subscription ID' })}`, id: id, attributes: { pause: { mode: propsValue.mode, resumes_at: resumesAt ?? null } } });
  },
});
