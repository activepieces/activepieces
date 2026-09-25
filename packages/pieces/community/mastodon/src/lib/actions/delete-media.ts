import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { deletedMediaOutputSchema } from '../output-schemas';

export const deleteMedia = createAction({
  auth: mastodonAuth,
  name: 'delete_media',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Media',
  description: 'Delete an uploaded media file that is not attached to a status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes an uploaded media attachment that has not been attached to a status yet (attached media is removed by deleting the status). Requires Mastodon 4.4 or later. Irreversible; repeating the call fails with not found.',
    idempotent: false,
  },
  outputSchema: deletedMediaOutputSchema,
  props: {
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description:
        'ID of the media attachment. Obtain it from Upload Media.',
      required: true,
    }),
  },
  async run(context) {
    await mastodonClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.DELETE,
      path: `/api/v1/media/${encodeURIComponent(context.propsValue.media_id)}`,
      operation: 'Delete Media',
      scope: 'write:media',
      minVersion: '4.4.0',
      notFoundMessage:
        'Mastodon could not find this unattached media. Delete Media only works for media not yet attached to a status (and requires Mastodon 4.4 or later); attached media is removed together with its status.',
    });
    return { success: true, media_id: context.propsValue.media_id };
  },
});
