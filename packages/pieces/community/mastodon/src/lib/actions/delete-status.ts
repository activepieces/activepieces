import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { deletedStatusOutputSchema } from '../output-schemas';

export const deleteStatus = createAction({
  auth: mastodonAuth,
  name: 'delete_status',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Status',
  description: 'Permanently delete one of your own statuses.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a status posted by the connected account and returns the deleted status including its source text (useful to redraft). Followers and remote servers may already have received it, so deletion cannot recall copies. Only works on your own posts; repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: deletedStatusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'ID of your own status to delete. Map it from a previous Post Status step (Status > Status ID), Create Status, Get Status or List Account Statuses.',
      required: true,
    }),
    delete_media: Property.Checkbox({
      displayName: 'Delete Media Immediately',
      description:
        'Delete the attached media right away instead of keeping it for about 24 hours for reuse. Requires Mastodon 4.4 or later; older servers ignore it.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}`,
      operation: 'Delete Status',
      scope: 'write:statuses',
      query: context.propsValue.delete_media === true ? { delete_media: true } : undefined,
    });
  },
});
