import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const revealMonitorSignature = createAction({
  auth: pubrioAuth,
  name: 'reveal_monitor_signature',
  displayName: 'Reveal Monitor Signature',
  description: 'Reveal the signature for a monitor (uses credits)',
  audience: 'both',
  aiMetadata: {
    description:
      'Reveal the enriched signature/contact data for a monitor identified by monitor_id. This consumes account credits, so call it only when the revealed data is actually needed rather than to inspect a monitor (use List Monitors for that). Not idempotent in cost.',
    idempotent: false,
  },
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
