import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const revealMonitorSignature = createAction({
  auth: pubrioAuth,
  name: 'reveal_monitor_signature',
  displayName: 'Reveal Monitor Signature',
  description: 'Reveal the signature for a monitor (uses credits)',
  props: {
    monitor_id: Property.ShortText({
      displayName: 'Monitor ID',
      required: true,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      monitor_id: context.propsValue.monitor_id,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors/signature/reveal',
      body
    );
  },
});
