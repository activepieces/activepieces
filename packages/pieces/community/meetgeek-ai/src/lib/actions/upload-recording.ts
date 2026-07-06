import { createAction, Property } from '@activepieces/pieces-framework';
import { meetgeekaiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const uploadRecording = createAction({
  auth: meetgeekaiAuth,
  name: 'uploadRecording',
  displayName: 'Upload Recording',
  description:
    'Upload a video or audio file for analysis and receive a notification upon completion via webhook',
  audience: 'both',
  aiMetadata: {
    description: 'Submit a video or audio recording to MeetGeek for transcription and AI analysis by passing a publicly accessible download URL (e.g. an S3 signed URL); analysis runs asynchronously and completion is signaled via the New Meeting webhook. Use to ingest an external recording into MeetGeek. Not idempotent: each call queues a new analysis job.',
    idempotent: false,
  },
  props: {
    download_url: Property.ShortText({
      displayName: 'Download URL',
      description:
        'A publicly accessible URL that initiates a direct download when accessed (e.g., S3 signed URL)',
      required: true,
    }),
    language_code: Property.ShortText({
      displayName: 'Language Code',
      description:
        'Language code for the recording (e.g., en-US, es-ES, fr-FR). See MeetGeek documentation for all available options.',
      required: false,
      defaultValue: 'en-US',
    }),
    template_name: Property.ShortText({
      displayName: 'Template Name',
      description:
        'Meeting template to use for analysis (e.g., "General meeting", "Sales call", "Interview"). See MeetGeek documentation for all available templates.',
      required: false,
      defaultValue: 'General meeting',
    }),
  },
  async run(context) {
    const { download_url, language_code, template_name } = context.propsValue;

    const body: any = {
      download_url,
    };

    if (language_code) {
      body.language_code = language_code;
    }

    if (template_name) {
      body.template_name = template_name;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/upload',
      body
    );

    return response;
  },
});
