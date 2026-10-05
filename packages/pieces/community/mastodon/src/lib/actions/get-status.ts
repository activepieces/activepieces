import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const getStatus = createAction({
  auth: mastodonAuth,
  name: 'get_status',
  classification: 'READ',
  displayName: 'Get Status',
  description: 'Get a single status by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one status by its local ID, including text, author, counts, media attachments and poll. Use it to read a post before replying, editing or engaging with it; for a status URL from another server, first import it with Search (resolve) to get a local ID. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'Local ID of the status on this server, for example 109372843234737004. Obtain it from a timeline, Create Status or Search.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}`,
      operation: 'Get Status',
      scope: 'read:statuses',
    });
  },
});
