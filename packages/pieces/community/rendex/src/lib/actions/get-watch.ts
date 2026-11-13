import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { rendexProps } from '../common/props';
import { watchOutputSchema } from '../common/output-schemas';

export const getWatch = createAction({
  auth: rendexAuth,
  name: 'get_watch',
  classification: 'READ',
  displayName: 'Get Watch',
  description: 'Get one website change watch with its settings, status and last check.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one Rendex watch by its Watch ID: URL, name, status (active or paused), schedule, change-detection settings, baseline image and the time and result of the last and next check. Use List Watch Runs for the check history. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: watchOutputSchema,
  props: {
    watch_id: rendexProps.watchDropdown(),
  },
  async run(context) {
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/watches/${rendexClient.segment({ value: context.propsValue.watch_id, label: 'Watch' })}`,
      operation: 'get the watch',
    });
  },
});
