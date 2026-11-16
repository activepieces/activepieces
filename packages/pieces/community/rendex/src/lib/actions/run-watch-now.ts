import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS } from '../common/common';
import { rendexProps } from '../common/props';
import { runWatchNowOutputSchema } from '../common/output-schemas';

export const runWatchNow = createAction({
  auth: rendexAuth,
  name: 'run_watch_now',
  classification: 'WRITE',
  displayName: 'Run Watch Check Now',
  description: 'Queue an immediate check of a website change watch, outside its schedule.',
  audience: 'both',
  aiMetadata: {
    description:
      'Queues an immediate check of one Rendex watch outside its schedule and returns the queued run id; the check finishes in the background, so read its result later with List Watch Runs. Fails with WATCH_PAUSED when the watch is paused (resume it with Update Watch). Each call spends one Rendex credit and queues another check.',
    idempotent: false,
  },
  outputSchema: runWatchNowOutputSchema,
  props: {
    watch_id: rendexProps.watchDropdown(),
  },
  async run(context) {
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/v1/watches/${rendexClient.segment({ value: context.propsValue.watch_id, label: 'Watch' })}/run`,
      body: {},
      timeoutMs: RENDEX_LIMITS.RENDER_TIMEOUT_MS,
      operation: 'run the watch check',
    });
  },
});
