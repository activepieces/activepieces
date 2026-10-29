import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { isRecord, readPath, validateLicenseKey } from '../common/client';
import { validateLicenseSchema } from '../common/output-schemas';

export const validateLicense = createAction({
  auth: lemonSqueezyAuth,
  name: 'validate_license',
  displayName: 'Validate License Key',
  description: 'Check whether a license key is valid, without activating it.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Checks a Lemon Squeezy license key string (and optionally one activation instance ID) with the License API and returns valid true/false, the reason when invalid, its status, activation limit and usage, expiry, and the product and customer it belongs to. Does not activate the key or use up an activation, and the key itself is not returned. Use when a customer sends a key and you need to confirm it before granting access or support. Idempotent.',
    idempotent: true,
  },
  outputSchema: validateLicenseSchema,
  props: {
    licenseKey: Property.ShortText({ displayName: 'License Key', description: 'The full license key to check.', required: true }),
    instanceId: Property.ShortText({
      displayName: 'Instance ID',
      description: 'Also check this activation (instance) of the key.',
      required: false,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const licenseKey = propsValue.licenseKey.trim();
    if (!licenseKey) throw new Error('License Key is required.');
    const instanceId = propsValue.instanceId?.trim() || undefined;
    const body = await validateLicenseKey({ licenseKey, instanceId });
    const key = readPath({ value: body, path: ['license_key'] });
    const error = readPath({ value: body, path: ['error'] });
    const instance = readPath({ value: body, path: ['instance'] });
    const meta = readPath({ value: body, path: ['meta'] });
    return {
      valid: readPath({ value: body, path: ['valid'] }) === true,
      error: typeof error === 'string' ? error : null,
      license_key: isRecord(key)
        ? {
            id: key['id'] ?? null,
            status: key['status'] ?? null,
            activation_limit: key['activation_limit'] ?? null,
            activation_usage: key['activation_usage'] ?? null,
            expires_at: key['expires_at'] ?? null,
            created_at: key['created_at'] ?? null,
            test_mode: key['test_mode'] ?? null,
          }
        : null,
      instance: isRecord(instance) ? instance : null,
      meta: isRecord(meta) ? meta : null,
    };
  },
});
