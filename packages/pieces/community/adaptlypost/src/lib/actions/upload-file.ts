import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

type UploadUrl = {
  fileName: string;
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export const uploadFileAction = createAction({
  auth: adaptlyPostAuth,
  name: 'upload_file',
  classification: 'WRITE',
  displayName: 'Upload File',
  description:
    'Uploads an image, video or document to AdaptlyPost and returns a public URL to use in Create Post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upload a file from an earlier step (JPG, PNG, WebP, GIF, MP4, MOV, PDF, PPT, PPTX, DOC or DOCX) to AdaptlyPost storage and get a public URL. Pass that URL in Media URLs of Create Post. Skip this when the media already has a public HTTPS URL. Each call stores a new copy.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The image, video or document to upload. Its file name must keep the extension, such as launch.jpg.',
      required: true,
    }),
  },
  async run(context) {
    const file = context.propsValue.file;
    const extension = (
      file.extension ??
      file.filename.split('.').pop() ??
      ''
    ).toLowerCase();
    const mimeType = MIME_TYPES[extension];
    if (!mimeType) {
      throw new Error(
        `AdaptlyPost can't take .${
          extension || '?'
        } files. Use one of: ${Object.keys(MIME_TYPES).join(', ')}.`
      );
    }
    const fileName = file.filename.toLowerCase().endsWith(`.${extension}`)
      ? file.filename
      : `${file.filename}.${extension}`;
    const response = await adaptlyPostClient.request<{ urls: UploadUrl[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/upload-urls',
      body: { files: [{ fileName, mimeType }] },
    });
    const upload = response.urls[0];
    if (!upload) throw new Error('AdaptlyPost did not return an upload URL.');
    await adaptlyPostClient.uploadToSignedUrl({
      url: upload.uploadUrl,
      data: file.data,
      mimeType,
    });
    return {
      public_url: upload.publicUrl,
      file_name: upload.fileName,
      mime_type: mimeType,
      key: upload.key,
    };
  },
});
