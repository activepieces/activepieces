import {
  ActionContext,
  createAction,
  ExecutionType,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { wavixAuth } from '../common/auth';
import { wavixApiCall, WAVIX_BASE_URL } from '../common/client';

const transcribeProps = {
  file: Property.File({
    displayName: 'Audio File',
    description: 'Audio file to transcribe — stereo WAV, MP3 or MP4, up to 25 MB.',
    required: true,
  }),
};

type TranscribeFileContext = ActionContext<
  typeof wavixAuth,
  typeof transcribeProps
>;

export const transcribeFile = createAction({
  auth: wavixAuth,
  name: 'transcribe_file',
  classification: 'WRITE',
  displayName: 'Transcribe Audio File',
  description:
    'Upload an audio file and wait for its transcript, speaker turns and summary.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads an audio file to Wavix Speech Analytics and returns the transcript (per channel), speaker turns with sentiment and a summary. Transcription runs asynchronously and is billed per minute; the action pauses until Wavix reports completion.',
    idempotent: false,
  },
  props: transcribeProps,
  async run(context: TranscribeFileContext) {
    if (context.executionType === ExecutionType.BEGIN) {
      const { file } = context.propsValue;

      // WEBHOOK waitpoint with a timeout so the flow never hangs if no callback arrives.
      const timeoutMs = 15 * 60 * 1000;
      const waitpoint = await context.run.createWaitpoint({
        type: 'WEBHOOK',
        resumeDateTime: new Date(Date.now() + timeoutMs).toUTCString(),
      });
      const resumeUrl = waitpoint.buildResumeUrl({ queryParams: {} });

      const formData = new FormData();
      formData.append('file', Buffer.from(file.base64, 'base64'), file.filename);
      formData.append('callback_url', resumeUrl);
      // Request the conversation summary and score.
      formData.append('insights', 'true');

      const submit = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${WAVIX_BASE_URL}/v1/speech-analytics`,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${context.auth.secret_text}`,
        },
        body: formData,
      });

      context.run.waitForWaitpoint(waitpoint.id);
      return submit.body;
    }

    const completion = context.resumePayload?.body as
      | { request_id: string; status: string; error?: string | null }
      | undefined;

    // Empty resume payload means the timeout fired instead of a callback.
    if (!completion?.request_id) {
      throw new Error(
        'Timed out waiting for Wavix to finish the transcription. The transcription may still complete on Wavix; retrieve it separately by request_id.'
      );
    }

    if (completion.status !== 'completed') {
      throw new Error(
        `Transcription ${completion.status}${
          completion.error ? `: ${completion.error}` : ''
        }`
      );
    }

    return await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourcePath: `/v1/speech-analytics/${completion.request_id}`,
    });
  },
});
