import FormData from 'form-data';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a media file and returns its ID to pass as Media IDs to Create Status, Schedule Status or Edit Status. Large video and audio are processed asynchronously: when processing is true the url is still null, so call Get Media until url is non-null before attaching it. Unattached uploads expire after a while. Each call uploads a new file.',
    idempotent: false,
  },
  outputSchema: mappedMediaOutputSchema,
  propertyGroups: [
    {
      key: 'upload',
      display: 'section',
      label: 'Upload',
      icon: 'paperclip',
      props: ['upload_info', 'file'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'text',
      props: ['description', 'focus'],
    },
  ],
  props: {
    upload_info: Property.MarkDown({
      value: 'Map the returned Media ID into Media IDs on Post, Schedule or Edit Status.',
      variant: MarkdownVariant.INFO,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The image, video or audio file to upload.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Alt Text',
      description: 'Describes the media for people using screen readers.',
      placeholder: 'A cat asleep on a keyboard',
      required: false,
    }),
    focus: Property.ShortText({
      displayName: 'Focal Point',
      description: 'Where thumbnails centre, as x,y from -1.0 to 1.0.',
      placeholder: '0.0,0.5',
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
