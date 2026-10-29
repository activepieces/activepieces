import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { isoDateOrUndefined, numericId, patchRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const updateLicenseKey = createAction({
  auth: lemonSqueezyAuth,
  name: 'update_license_key',
  displayName: 'Update License Key',
  description: "Change a license key's activation limit, expiry or disabled state.",
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a Lemon Squeezy license key by numeric ID: activation limit (or unlimited), expiry date (ISO 8601, or never), and enable/disable. Only the fields you set change; at least one is required. Disabling blocks activation and validation of the key. Idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.licenseKey),
  props: {
    licenseKeyId: Property.ShortText({
      displayName: 'License Key ID',
      description: 'The numeric ID of the license key.',
      required: true,
    }),
    activationLimit: Property.Number({ displayName: 'Activation Limit', description: 'New maximum number of activations.', required: false }),
    unlimitedActivations: Property.Checkbox({ displayName: 'Unlimited Activations', description: 'Remove the activation limit.', required: false, defaultValue: false }),
    expiresAt: Property.ShortText({ displayName: 'Expires At', description: 'New ISO 8601 expiry date-time, for example 2027-01-31T00:00:00Z.', required: false }),
    neverExpires: Property.Checkbox({ displayName: 'Never Expires', description: 'Remove the expiry date.', required: false, defaultValue: false }),
    disabled: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Leave empty to keep the current state.',
      required: false,
      options: { options: [{ label: 'Disable key', value: 'disable' }, { label: 'Enable key', value: 'enable' }] },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const id = numericId({ value: propsValue.licenseKeyId, label: 'License Key ID' });
    const attributes: Record<string, unknown> = {};
    const hasLimit = propsValue.activationLimit !== undefined && propsValue.activationLimit !== null;
    if (hasLimit && propsValue.unlimitedActivations) throw new Error('Set either Activation Limit or Unlimited Activations, not both.');
    if (hasLimit) {
      const limit = Number(propsValue.activationLimit);
      if (!Number.isInteger(limit) || limit < 1) throw new Error('Activation Limit must be a whole number of 1 or more.');
      attributes['activation_limit'] = limit;
    }
    if (propsValue.unlimitedActivations) attributes['activation_limit'] = null;
    const expiresAt = isoDateOrUndefined({ value: propsValue.expiresAt, label: 'Expires At' });
    if (expiresAt && propsValue.neverExpires) throw new Error('Set either Expires At or Never Expires, not both.');
    if (expiresAt) attributes['expires_at'] = expiresAt;
    if (propsValue.neverExpires) attributes['expires_at'] = null;
    if (propsValue.disabled === 'disable') attributes['disabled'] = true;
    if (propsValue.disabled === 'enable') attributes['disabled'] = false;
    if (Object.keys(attributes).length === 0) throw new Error('Nothing to update: set at least one field.');
    return patchRecord({ apiKey: auth.secret_text, type: 'license-keys', path: `/license-keys/${seg({ value: id, label: 'License Key ID' })}`, id: id, attributes: attributes });
  },
});
