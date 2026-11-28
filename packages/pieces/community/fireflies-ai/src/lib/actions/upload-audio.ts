import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesClient } from '../common/client';
import { firefliesInput, YES_NO_OPTIONS } from '../common/props';
import { firefliesQueries } from '../common/queries';
import { firefliesOutputSchemas } from '../output-schemas';

export const uploadAudioAction = createAction({
  auth: firefliesAiAuth,
  name: 'upload_audio',
  classification: 'WRITE',
  displayName: 'Upload Audio',
  description: 'Creates a new meeting in Fireflies for transcription (requires a publicly accessible URL).',
  audience: 'both',
  aiMetadata: {
    description:
      'Submits a public HTTPS audio or video URL (mp3, mp4, wav, m4a, ogg) to Fireflies, which creates a new meeting and transcribes it. Needs a paid Fireflies plan. Each call queues a new transcription, so retries create duplicates.',
    idempotent: false,
  },
  outputSchema: firefliesOutputSchemas.uploadAudio,
  props: {
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description:
        'The publicly accessible HTTPS URL of your audio or video file (mp3, mp4, wav, m4a, ogg). Fireflies only accepts URLs, not direct file uploads. For private files, use a signed URL with a short expiry.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    client_reference_id: Property.ShortText({
      displayName: 'Client Reference ID',
      description: 'Optional. Your own ID for this upload. Fireflies echoes it back in its webhooks.',
      required: false,
      advanced: true,
    }),
    custom_language: Property.ShortText({
      displayName: 'Language Code',
      description: 'Optional. Language of the recording as a code such as "es" or "de". Leave empty for English.',
      required: false,
      advanced: true,
    }),
    meeting_date: Property.ShortText({
      displayName: 'Meeting Date',
      description: 'Optional. When the meeting happened, as ISO 8601 (for example 2026-03-15 or 2026-03-15T14:30:00Z). Cannot be in the future.',
      required: false,
      advanced: true,
    }),
    bypass_size_check: Property.StaticDropdown<string>({
      displayName: 'Allow Small Files',
      description: 'Optional. Choose "Yes" to upload files under 50 KB, which Fireflies otherwise rejects.',
      required: false,
      advanced: true,
      options: { disabled: false, options: YES_NO_OPTIONS },
    }),
  },
  async run({ propsValue, auth }) {
    const input = buildUploadInput({
      audioUrl: propsValue.audioUrl,
      title: propsValue.title,
      clientReferenceId: propsValue.client_reference_id,
      customLanguage: propsValue.custom_language,
      meetingDate: propsValue.meeting_date,
      bypassSizeCheck: propsValue.bypass_size_check,
      now: Date.now(),
    });
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.uploadAudio,
      variables: { input },
      operation: 'upload audio',
    });
    const result = firefliesClient.requireEntity({ data, key: 'uploadAudio', notFound: 'Fireflies returned no result for the upload.' });
    if (result['success'] !== true) {
      const message = firefliesInput.optionalText(result['message']) ?? 'no message returned';
      throw new Error(`Fireflies did not accept the upload: ${message}`);
    }
    return { success: true, title: result['title'] ?? null, message: result['message'] ?? null };
  },
});

function buildUploadInput({ audioUrl, title, clientReferenceId, customLanguage, meetingDate, bypassSizeCheck, now }: UploadInputParams): Record<string, unknown> {
  const input: Record<string, unknown> = {
    url: firefliesInput.requireText({ value: audioUrl, label: 'Audio URL' }),
    title: firefliesInput.requireText({ value: title, label: 'Title' }),
  };
  const reference = firefliesInput.optionalText(clientReferenceId);
  if (reference !== undefined) {
    input['client_reference_id'] = reference;
  }
  const language = firefliesInput.optionalText(customLanguage);
  if (language !== undefined) {
    input['custom_language'] = language;
  }
  const date = firefliesInput.strictIsoDate({ value: meetingDate, label: 'Meeting Date', dateOnlyAs: 'noon' });
  if (date !== undefined) {
    if (date.epochMs > now + FUTURE_TOLERANCE_MS && !(date.dateOnly && date.iso.slice(0, 10) === new Date(now).toISOString().slice(0, 10))) {
      throw new Error(`Meeting Date cannot be in the future (got ${date.iso}).`);
    }
    input['meeting_date'] = date.dateOnly && date.epochMs > now ? new Date(now).toISOString() : date.iso;
  }
  const bypass = firefliesInput.yesNo({ value: bypassSizeCheck, label: 'Allow Small Files' });
  if (bypass !== undefined) {
    input['bypass_size_check'] = bypass;
  }
  return input;
}

export const uploadAudioInternals = { buildUploadInput };

const FUTURE_TOLERANCE_MS = 60_000;

type UploadInputParams = {
  audioUrl: unknown;
  title: unknown;
  clientReferenceId: unknown;
  customLanguage: unknown;
  meetingDate: unknown;
  bypassSizeCheck: unknown;
  now: number;
};
