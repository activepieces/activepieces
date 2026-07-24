import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const getMonitorAi = createAction({
  auth: pubrioAuth,
  name: 'get_monitor_ai',
  displayName: 'Get Monitor',
  description: 'Fetch one signal monitor by its ID',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch one signal monitor by its `monitor_id` (from List Monitors), optionally with signature-reveal data (note: signature reveal consumes credits — leave off unless needed). Read-only and repeatable.',
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
