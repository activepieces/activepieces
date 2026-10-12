import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { LemonSqueezyApiError, getRecord, lookupLicenseKeyId, seg } from '../common/client';
import { flatFields } from '../common/output-schemas';

export const getLicenseKey = createAction({
  auth: lemonSqueezyAuth,
  name: 'get_license_key',
  displayName: 'Get License Key',
  description: 'Retrieve a license key by ID or by the key itself.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Lemon Squeezy license key by numeric license key ID or by the full key string (give exactly one). Returns the full key, status, activation limit and count, expiry and the owning order/customer. Returns found=false when the key does not exist. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'license_key', label: 'License Key', description: 'Null when not found.', children: flatFields.licenseKey },
    ],
  },
  props: {
    licenseKeyId: Property.ShortText({
      displayName: 'License Key ID',
      description: 'The numeric license key ID. Leave empty when searching by key.',
      required: false,
    }),
    licenseKey: Property.ShortText({
      displayName: 'License Key',
      description: 'The full license key string. Leave empty when using the ID.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const byId = propsValue.licenseKeyId?.trim() || undefined;
    const byKey = propsValue.licenseKey?.trim() || undefined;
    if ((byId ? 1 : 0) + (byKey ? 1 : 0) !== 1) throw new Error('Provide exactly one of License Key ID or License Key.');
    const id = byId ?? ((byKey ? await lookupLicenseKeyId(byKey) : undefined));
    if (!id) return { found: false, license_key: null };
    try {
      return { found: true, license_key: await getRecord({ apiKey: auth.secret_text, path: `/license-keys/${seg({ value: id, label: 'License Key ID' })}` }) };
    } catch (error) {
      if (error instanceof LemonSqueezyApiError && error.status === 404) return { found: false, license_key: null };
      throw error;
    }
  },
});
