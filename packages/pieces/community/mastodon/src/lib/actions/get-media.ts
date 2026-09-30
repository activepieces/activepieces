import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient } from '../common/client';
import { mappedMediaOutputSchema } from '../output-schemas';

export const getMedia = createAction({
  auth: mastodonAuth,
  name: 'get_media',
  classification: 'READ',
  displayName: 'Get Media',
  description: 'Check an uploaded media file, including whether it has finished processing.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads an uploaded media attachment to check whether processing has finished (processing false and url non-null); poll it after Upload Media before attaching large video or audio. Only works for media not yet attached to a status; to read attached media use Get Status (media_attachments). Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: mappedMediaOutputSchema,
  props: {
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of the unattached media. Obtain it from Upload Media.',
      required: true,
    }),
  },
  async run(context) {
    const response = await mastodonClient.sendRequest<MediaAttachment>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/api/v1/media/${encodeURIComponent(context.propsValue.media_id)}`,
      operation: 'Get Media',
      scope: 'write:media',
      notFoundMessage:
        'Mastodon could not find this media. Get Media only works for media not yet attached to a status; to read attached media use Get Status (media_attachments).',
    });
    const media = response.body;
    return {
      id: media.id,
      type: media.type,
      url: media.url ?? null,
      preview_url: media.preview_url ?? null,
      description: media.description ?? null,
      processing: response.status === 206,
    };
  },
});

type MediaAttachment = {
  id: string;
  type: string;
  url: string | null;
  preview_url: string | null;
  description: string | null;
};
