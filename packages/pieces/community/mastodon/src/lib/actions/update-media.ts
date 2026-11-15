import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonUtils } from '../common/client';
import { mediaAttachmentOutputSchema } from '../output-schemas';

export const updateMedia = createAction({
  auth: mastodonAuth,
  name: 'update_media',
  classification: 'WRITE',
  displayName: 'Update Media',
  description: 'Change the alt text or focal point of an uploaded media file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates the alt text and/or focal point of an uploaded media attachment before it is posted; only the fields you set are sent. Only works for media not yet attached to a status; to change media on a published post use Edit Status. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: mediaAttachmentOutputSchema,
  props: {
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of the unattached media. Obtain it from Upload Media.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Alt Text',
      description: 'New plain-text description of the media for accessibility.',
      required: false,
    }),
    focus: Property.ShortText({
      displayName: 'Focal Point',
      description:
        'New focal point as two comma-separated numbers from -1.0 to 1.0, for example 0.0,0.5.',
      required: false,
    }),
  },
  async run(context) {
    const { media_id, description, focus } = context.propsValue;
    const body = {
      ...(mastodonUtils.hasValue(description) ? { description } : {}),
      ...(mastodonUtils.hasValue(focus) ? { focus } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set Alt Text or Focal Point; there is nothing to update.');
    }
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/api/v1/media/${encodeURIComponent(media_id)}`,
      operation: 'Update Media',
      scope: 'write:media',
      notFoundMessage:
        'Mastodon could not find this media. Update Media only works for media not yet attached to a status; to change media on a published post use Edit Status.',
      body,
    });
  },
});
