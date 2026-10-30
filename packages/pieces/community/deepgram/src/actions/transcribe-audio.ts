import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAudio } from '../common/audio';
import { deepgramAuth } from '../common/auth';
import { DEFAULT_STT_MODEL, REDACT_OPTIONS } from '../common/constants';
import { deepgramProps } from '../common/props';
import { deepgramTranscript } from '../common/transcript';
import { transcribeAudioOutputSchema } from '../output-schemas';

export const transcribeAudioAction = createAction({
  auth: deepgramAuth,
  name: 'transcribe_audio',
  classification: 'READ',
  displayName: 'Transcribe Audio',
  description:
    'Transcribes an audio or video file or URL and returns the transcript, with optional speakers, paragraphs, summary, topics and more.',
  audience: 'human',
  aiMetadata: {
    description:
      'Transcribes speech from a public audio/video URL or an uploaded file with Deepgram and returns the full transcript, optionally with speaker labels, paragraphs, detected language, entities and an English-only summary, topics, intents and sentiment. Use for recordings that finish processing within about 8 minutes; for very long files use Create Transcription (Callback). Each call is billed per audio minute, so retries are billed again.',
    idempotent: false,
  },
  outputSchema: transcribeAudioOutputSchema,
  props: {
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description:
        'A public link to the audio or video file. Deepgram downloads it directly. Use this or Audio File.',
      required: false,
    }),
    audioFile: Property.File({
      displayName: 'Audio File',
      description:
        'The audio or video file to transcribe. Use this or Audio URL.',
      required: false,
    }),
    model: deepgramProps.sttModel({
      description: `Leave empty for ${DEFAULT_STT_MODEL}, Deepgram's recommended model for most languages.`,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description:
        'Spoken language as a BCP-47 code, for example en, es, fr-CA or multi (several languages in one recording, nova-3 only). Leave empty for English, or turn on Detect Language.',
      required: false,
    }),
    detectLanguage: Property.Checkbox({
      displayName: 'Detect Language',
      description:
        'Let Deepgram detect the main spoken language. Ignores Language.',
      required: false,
      defaultValue: false,
    }),
    smartFormat: Property.Checkbox({
      displayName: 'Smart Format',
      description:
        'Add punctuation, capitals and readable numbers, dates and currency.',
      required: false,
      defaultValue: true,
    }),
    diarize: Property.Checkbox({
      displayName: 'Identify Speakers',
      description:
        'Label who speaks when and return a transcript split by speaker.',
      required: false,
      defaultValue: false,
    }),
    paragraphs: Property.Checkbox({
      displayName: 'Paragraphs',
      description: 'Also return the transcript split into paragraphs.',
      required: false,
      defaultValue: false,
    }),
    utterances: Property.Checkbox({
      displayName: 'Utterances',
      description:
        'Also return the transcript as timed segments (sentences or speaker turns).',
      required: false,
      defaultValue: false,
    }),
    multichannel: Property.Checkbox({
      displayName: 'Transcribe Each Channel Separately',
      description:
        'For stereo recordings with one speaker per channel, such as call recordings. Billed per channel.',
      required: false,
      defaultValue: false,
    }),
    keyterms: Property.Array({
      displayName: 'Key Terms',
      description:
        'Names, brands or jargon to recognize more reliably (nova-3 models only). Up to 100 terms.',
      required: false,
    }),
    redact: Property.StaticMultiSelectDropdown({
      displayName: 'Redact',
      description:
        'Replace sensitive information in the transcript. Billed as an add-on.',
      required: false,
      options: { disabled: false, options: REDACT_OPTIONS },
    }),
    detectEntities: Property.Checkbox({
      displayName: 'Detect Entities',
      description:
        'Return names, organizations, places, numbers and other entities found in the speech.',
      required: false,
      defaultValue: false,
    }),
    summarize: Property.Checkbox({
      displayName: 'Summarize (English)',
      description:
        'Return a short summary. English audio only; needs more than about 50 spoken words.',
      required: false,
      defaultValue: false,
    }),
    topics: Property.Checkbox({
      displayName: 'Detect Topics (English)',
      required: false,
      defaultValue: false,
    }),
    intents: Property.Checkbox({
      displayName: 'Detect Intents (English)',
      required: false,
      defaultValue: false,
    }),
    sentiment: Property.Checkbox({
      displayName: 'Analyze Sentiment (English)',
      required: false,
      defaultValue: false,
    }),
    includeWords: Property.Checkbox({
      displayName: 'Include Word Timings',
      description:
        'Return every word with its start and end time. Makes the output much larger.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Labels for this request that show up in Deepgram usage reports.',
      required: false,
    }),
  },
  async run(context) {
    return transcribeAudio({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function transcribeAudio({
  apiKey,
  input,
}: {
  apiKey: string;
  input: TranscribeAudioInput;
}) {
  const props = input;
  const model = props.model?.trim() || DEFAULT_STT_MODEL;
  const language = props.language?.trim() || undefined;
  const detectLanguage = props.detectLanguage === true;
  const intelligence =
    props.summarize === true ||
    props.topics === true ||
    props.intents === true ||
    props.sentiment === true;
  if (intelligence && !detectLanguage && !deepgramAudio.isEnglish(language)) {
    throw new Error(
      'Summary, topics, intents and sentiment only work on English audio. Clear the Language field or turn these options off.'
    );
  }
  const keyterms = textList({
    value: props.keyterms,
    label: 'Key Terms',
    max: 100,
  });
  if (keyterms.length > 0 && !model.startsWith('nova-3')) {
    throw new Error(
      'Key Terms only work with nova-3 models. Choose a nova-3 model or remove the key terms.'
    );
  }
  const redact = textList({ value: props.redact, label: 'Redact', max: 4 });
  const unknownRedact = redact.filter(
    (item) => !['pci', 'pii', 'phi', 'numbers'].includes(item)
  );
  if (unknownRedact.length > 0) {
    throw new Error(
      `Unknown redaction type: ${unknownRedact.join(
        ', '
      )}. Use pci, pii, phi or numbers.`
    );
  }
  const tags = textList({ value: props.tags, label: 'Tags', max: 20 });
  const source = deepgramAudio.resolveSource({
    audioUrl: props.audioUrl,
    audioFile: props.audioFile,
    fallbackContentType: 'application/octet-stream',
  });
  const body = await deepgramAudio.listen({
    apiKey: apiKey,
    source,
    query: {
      model,
      language: detectLanguage ? undefined : language,
      detect_language: detectLanguage ? 'true' : undefined,
      smart_format: props.smartFormat === false ? undefined : 'true',
      diarize_model: props.diarize === true ? 'latest' : undefined,
      paragraphs: props.paragraphs === true ? 'true' : undefined,
      utterances: props.utterances === true ? 'true' : undefined,
      multichannel: props.multichannel === true ? 'true' : undefined,
      detect_entities: props.detectEntities === true ? 'true' : undefined,
      summarize: props.summarize === true ? 'v2' : undefined,
      topics: props.topics === true ? 'true' : undefined,
      intents: props.intents === true ? 'true' : undefined,
      sentiment: props.sentiment === true ? 'true' : undefined,
      keyterm: keyterms,
      redact,
      tag: tags,
    },
    operation: 'transcribe the audio',
  });
  return deepgramTranscript.flattenListen({
    body,
    includeWords: props.includeWords === true,
  });
}

function textList({
  value,
  label,
  max,
}: {
  value: unknown;
  label: string;
  max: number;
}): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const items = Array.isArray(value) ? value : [value];
  const texts = items
    .map((item) =>
      typeof item === 'string' || typeof item === 'number'
        ? String(item).trim()
        : ''
    )
    .filter((item) => item.length > 0);
  if (texts.length > max) {
    throw new Error(`${label} accepts at most ${max} values.`);
  }
  return texts;
}

export type TranscribeAudioInput = {
  audioUrl?: string;
  audioFile?: unknown;
  model?: string;
  language?: string;
  detectLanguage?: boolean;
  smartFormat?: boolean;
  diarize?: boolean;
  paragraphs?: boolean;
  utterances?: boolean;
  multichannel?: boolean;
  keyterms?: unknown[];
  redact?: string[];
  detectEntities?: boolean;
  summarize?: boolean;
  topics?: boolean;
  intents?: boolean;
  sentiment?: boolean;
  includeWords?: boolean;
  tags?: unknown[];
};
