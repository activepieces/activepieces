import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { rendexInput } from '../common/common';
import { rendexProps } from '../common/props';
import { deleteWatchOutputSchema } from '../common/output-schemas';

export const deleteWatch = createAction({
  auth: rendexAuth,
  name: 'delete_watch',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Watch',
  description: 'Permanently delete a website change watch and its check history.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Rendex watch and all of its check history; it cannot be undone. To stop checks but keep the history, use Update Watch with Paused set to pause instead. A second call for the same watch fails with WATCH_NOT_FOUND.',
    idempotent: false,
  },
  outputSchema: deleteWatchOutputSchema,
  props: {
    watch_id: rendexProps.watchDropdown(),
  },
  async run(context) {
    const id = rendexClient.segment({ value: context.propsValue.watch_id, label: 'Watch' });
    await rendexClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/v1/watches/${id}`,
      operation: 'delete the watch',
      allowEmpty: true,
    });
    return { deleted: true, id: rendexInput.optionalText(context.propsValue.watch_id) ?? decodeURIComponent(id) };
  },
});
