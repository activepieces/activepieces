import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Status to Delete',
      icon: 'trash',
      props: ['delete_warning', 'status_id', 'delete_media'],
    },
  ],
  props: {
    delete_warning: Property.MarkDown({
      value: 'Deleting a status is permanent and cannot be undone.',
      variant: MarkdownVariant.WARNING,
    }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'ID of one of your own statuses, for example from Post Status.',
      placeholder: '109372843234737004',
      required: true,
    }),
    delete_media: Property.Checkbox({
      displayName: 'Delete Media Now',
      description:
        'Remove attached media now, not after about 24 hours. Mastodon 4.4+.',
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
