import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const bookmarkStatus = createAction({
  auth: mastodonAuth,
  name: 'bookmark_status',
  classification: 'WRITE',
  displayName: 'Bookmark Status',
  description: 'Privately bookmark a status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Bookmarks a status privately for the connected account (the author is not notified); read bookmarks back with List Bookmarks. Use Favourite Status for a public like. Safe to retry. Returns the updated status.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'Local ID of the status on this server, for example 109372843234737004. Obtain it from a timeline, Get Status or Search (use resolve for a status URL from another server).',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/bookmark`,
      operation: 'Bookmark Status',
      scope: 'write:bookmarks',
    });
  },
});
