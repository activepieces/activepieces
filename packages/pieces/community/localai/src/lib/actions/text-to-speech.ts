import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { localaiAuth } from '../auth';
import { localaiCommon } from '../common';
import { textToSpeechOutputSchema } from '../output-schemas';

export const textToSpeech = createAction({
  audience: 'both',
  auth: localaiAuth,
  name: 'text_to_speech',
  classification: 'READ',
  displayName: 'Text to Speech',
  description: 'Turn text into a spoken audio file.',
  aiMetadata: { description: 'Converts text into a spoken audio file with a text-to-speech model installed on the connected self-hosted LocalAI server (for example a piper, kokoro, or bark voice), and saves it as a file in the flow, returning the file reference, name, format, and size. The model must be a speech model, not a chat model: call list_models when unsure. Voice is optional and model-specific, and only some backends honor the output format, so WAV is the safe choice. Each call writes a new file, so it is not idempotent.', idempotent: false },
  props: {
    model: localaiCommon.modelDropdown({
      displayName: 'Model',
      description: 'A text-to-speech model installed on your LocalAI server.',
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to read aloud.',
      required: true,
    }),
    voice: Property.ShortText({
      displayName: 'Voice',
      description: 'For models with several voices. Empty uses the default.',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Audio Format',
      description: 'Not every LocalAI backend supports every format.',
      required: true,
      defaultValue: 'wav',
      options: {
        options: [
          { label: 'WAV', value: 'wav' },
          { label: 'MP3', value: 'mp3' },
          { label: 'OGG', value: 'ogg' },
          { label: 'FLAC', value: 'flac' },
        ],
      },
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the audio file, without the extension.',
      required: false,
      defaultValue: 'speech',
    }),
  },
  outputSchema: textToSpeechOutputSchema,
  async run({ auth, propsValue, files }) {
    const { model, text, voice, format } = propsValue;
    const { data, error } = await sendSpeechRequest({
      url: `${localaiCommon.baseUrl(auth)}/audio/speech`,
      headers: localaiCommon.authHeaders(auth),
      body: {
        model,
        input: text,
        response_format: format,
        ...(voice ? { voice } : {}),
      },
    });
    if (data === null) {
      throw localaiCommon.friendlyError(error);
    }
    const fileName = `${propsValue.fileName?.trim() || 'speech'}.${format}`;
    const file = await files.write({ fileName, data });
    return {
      file,
      file_name: fileName,
      format,
      size_bytes: data.length,
      model,
    };
  },
});

async function sendSpeechRequest({
  url,
  headers,
  body,
}: {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}): Promise<{ data: Buffer; error: null } | { data: null; error: unknown }> {
  try {
    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.POST,
      url,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body,
      responseType: 'arraybuffer',
      timeout: localaiCommon.requestTimeoutMs * 2,
    });
    return { data: Buffer.from(response.body), error: null };
  } catch (error) {
    return { data: null, error };
  }
}
