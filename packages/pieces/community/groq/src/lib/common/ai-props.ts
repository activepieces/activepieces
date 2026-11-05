import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function modelId<R extends boolean>({
  required,
  displayName = 'Model',
  description = 'Groq model ID, e.g. "openai/gpt-oss-20b". Use List Models to find the IDs on this account.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function audioFile<R extends boolean>({
  required,
  displayName = 'Audio File',
  description = 'The audio file: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav or webm, up to 25 MB. Give either this or Audio URL, not both.',
}: PropParams<R>) {
  return Property.File({ displayName, description, required });
}

function audioUrl<R extends boolean>({
  required,
  displayName = 'Audio URL',
  description = 'Public URL of the audio file, for files over 25 MB. Give either this or Audio File, not both.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function audioResponseFormat<R extends boolean>({
  required,
  displayName = 'Response Format',
  description = '"json" returns the text; "verbose_json" adds language, duration and timed segments. Defaults to "json".',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'JSON', value: 'json' },
        { label: 'Verbose JSON', value: 'verbose_json' },
      ],
    },
  });
}

function additionalFields<R extends boolean>({
  required,
  displayName = 'Additional Fields',
  description = 'Any other request body fields from the Groq API reference, as a JSON object. The dedicated inputs above override keys set here.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

export const groqAiProps = {
  modelId,
  audioFile,
  audioUrl,
  audioResponseFormat,
  additionalFields,
};
