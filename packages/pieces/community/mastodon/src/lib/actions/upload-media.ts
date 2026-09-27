import FormData from 'form-data';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonClient, mastodonUtils } from '../common/client';
import { mappedMediaOutputSchema } from '../output-schemas';

export const uploadMedia = createAction({
  auth: mastodonAuth,
  name: 'upload_media',
  classification: 'WRITE',
  displayName: 'Upload Media',
  description: 'Upload an image, video or audio file to attach to a status.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a media file and returns its ID to pass as Media IDs to Create Status, Schedule Status or Edit Status. Large video and audio are processed asynchronously: when processing is true the url is still null, so call Get Media until url is non-null before attaching it. Unattached uploads expire after a while. Each call uploads a new file.',
    idempotent: false,
  },
  outputSchema: mappedMediaOutputSchema,
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The image, video or audio file to upload.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Alt Text',
      description: 'Plain-text description of the media for accessibility (alt text).',
      required: false,
    }),
    focus: Property.ShortText({
      displayName: 'Focal Point',
      description:
        'Focal point for thumbnail cropping as two comma-separated numbers from -1.0 to 1.0, for example 0.0,0.5.',
      required: false,
    }),
  },
  async run(context) {
    const { file, description, focus } = context.propsValue;
    const form = new FormData();
    form.append('file', file.data, file.filename);
    if (mastodonUtils.hasValue(description)) {
      form.append('description', String(description));
    }
    if (mastodonUtils.hasValue(focus)) {
      form.append('focus', String(focus));
    }
    const response = await mastodonClient.sendRequest<MediaAttachment>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/api/v2/media',
      operation: 'Upload Media',
      scope: 'write:media',
      body: form,
    });
    const media = response.body;
    return {
      id: media.id,
      type: media.type,
      url: media.url ?? null,
      preview_url: media.preview_url ?? null,
      description: media.description ?? null,
      processing: response.status === 202,
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
