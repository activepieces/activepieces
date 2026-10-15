import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listLicenseKeyInstances = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_license_key_instances',
  displayName: 'List License Key Activations',
  description: 'List the activations (instances) of license keys.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the activations (instances, for example a machine or site) of Lemon Squeezy license keys, optionally for one license key ID, with page-based pagination. Use to see where a customer activated a key before raising its activation limit or helping them free a slot. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.licenseKeyInstance, itemLabel: 'name' }),
  props: {
    licenseKeyId: Property.ShortText({
      displayName: 'License Key ID',
      description: 'Only activations of this license key.',
      required: false,
    }),
    ...pageProps('activations'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/license-key-instances',
      query: {
        'filter[license_key_id]': optionalId({ value: propsValue.licenseKeyId, label: 'License Key ID' }),
        ...pageParams(propsValue),
      },
    });
  },
});
