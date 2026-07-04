import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getMonitor = createAction({
  auth: pubrioAuth,
  name: 'get_monitor',
  displayName: 'Get Monitor',
  description: 'Look up a monitor by ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single monitor by its ID, optionally including signature-reveal data. Read-only and repeatable; requires a known monitor ID rather than search criteria.',
    idempotent: true,
  },
  props: {
    monitor_id: Property.ShortText({
      displayName: 'Monitor ID',
      required: true,
    }),
    is_signature_reveal: Property.Checkbox({
      displayName: 'Include Signature Reveal',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      monitor_id: context.propsValue.monitor_id,
    };
    if (context.propsValue.is_signature_reveal)
      body['is_signature_reveal'] = context.propsValue.is_signature_reveal;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors/lookup',
      body
    );
  },
});
