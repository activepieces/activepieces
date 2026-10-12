import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const favouriteStatus = createAction({
  auth: mastodonAuth,
  name: 'favourite_status',
  classification: 'WRITE',
  displayName: 'Favourite Status',
  description: 'Add a status to your favourites.',
  audience: 'both',
  aiMetadata: {
    description:
      'Favourites (likes) a status as the connected account; the author is notified. Use Bookmark Status to save privately instead. Favouriting an already-favourited status changes nothing, so it is safe to retry. Returns the updated status.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'ID of the status to favourite, for example 109372843234737004. Map it from a trigger such as New Mention (Related Status > Status ID), a timeline, Get Status or Search (Search turns a status URL from another server into an ID).',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/favourite`,
      operation: 'Favourite Status',
      scope: 'write:favourites',
    });
  },
});
