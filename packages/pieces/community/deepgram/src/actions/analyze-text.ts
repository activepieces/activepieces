import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { deepgramRead } from '../common/read';
import { deepgramTranscript } from '../common/transcript';
import { analyzeTextOutputSchema } from '../output-schemas';

export const analyzeTextAction = createAction({
  auth: deepgramAuth,
  name: 'analyze_text',
  classification: 'READ',
  displayName: 'Analyze Text',
  description:
    'Summarizes English text and detects its topics, intents and sentiment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs Deepgram text intelligence on English text (or a public text URL) and returns a summary, topics, intents and/or sentiment; choose at least one. Use for text you already have; for audio use deepgram_transcribe_audio with the same options. Billed per token, so repeat calls are billed again.',
    idempotent: false,
  },
  outputSchema: analyzeTextOutputSchema,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The English text to analyze. Use this or Text URL.',
      required: false,
    }),
    textUrl: Property.ShortText({
      displayName: 'Text URL',
      description:
        'A public link to a plain-text file. Deepgram downloads it directly. Use this or Text.',
      required: false,
    }),
    summarize: Property.Checkbox({
      displayName: 'Summarize',
      required: false,
      defaultValue: true,
    }),
    topics: Property.Checkbox({
      displayName: 'Detect Topics',
      required: false,
      defaultValue: false,
    }),
    intents: Property.Checkbox({
      displayName: 'Detect Intents',
      required: false,
      defaultValue: false,
    }),
    sentiment: Property.Checkbox({
      displayName: 'Analyze Sentiment',
      required: false,
      defaultValue: false,
    }),
    customTopics: Property.Array({
      displayName: 'Custom Topics',
      description:
        'Topics to look for in addition to (or instead of) the detected ones. Up to 100.',
      required: false,
    }),
    customTopicMode: Property.StaticDropdown({
      displayName: 'Custom Topic Mode',
      description:
        'Extended adds your topics to the detected ones; Strict only returns your topics.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Extended', value: 'extended' },
          { label: 'Strict', value: 'strict' },
        ],
      },
    }),
    customIntents: Property.Array({
      displayName: 'Custom Intents',
      description:
        'Intents to look for in addition to (or instead of) the detected ones. Up to 100.',
      required: false,
    }),
    customIntentMode: Property.StaticDropdown({
      displayName: 'Custom Intent Mode',
      description:
        'Extended adds your intents to the detected ones; Strict only returns your intents.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Extended', value: 'extended' },
          { label: 'Strict', value: 'strict' },
        ],
      },
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const text = typeof props.text === 'string' ? props.text : '';
    const textUrl = props.textUrl?.trim() ?? '';
    if (text.trim().length > 0 && textUrl.length > 0) {
      throw new Error('Provide either Text or Text URL, not both.');
    }
    if (text.trim().length === 0 && textUrl.length === 0) {
      throw new Error('Provide the text to analyze or a Text URL.');
    }
    if (textUrl.length > 0 && !/^https?:\/\//i.test(textUrl)) {
      throw new Error('Text URL must start with https:// or http://.');
    }
    const customTopics = textList({
      value: props.customTopics,
      label: 'Custom Topics',
    });
    const customIntents = textList({
      value: props.customIntents,
      label: 'Custom Intents',
    });
    const topics = props.topics === true || customTopics.length > 0;
    const intents = props.intents === true || customIntents.length > 0;
    const summarize = props.summarize === true;
    const sentiment = props.sentiment === true;
    if (!summarize && !topics && !intents && !sentiment) {
      throw new Error(
        'Turn on at least one of Summarize, Detect Topics, Detect Intents or Analyze Sentiment.'
      );
    }
    const body = await deepgramRead.readText({
      apiKey: context.auth.secret_text,
      query: {
        language: 'en',
        summarize: summarize ? 'true' : undefined,
        topics: topics ? 'true' : undefined,
        intents: intents ? 'true' : undefined,
        sentiment: sentiment ? 'true' : undefined,
        custom_topic: customTopics,
        custom_topic_mode:
          customTopics.length > 0
            ? props.customTopicMode ?? undefined
            : undefined,
        custom_intent: customIntents,
        custom_intent_mode:
          customIntents.length > 0
            ? props.customIntentMode ?? undefined
            : undefined,
      },
      source: textUrl.length > 0 ? { url: textUrl } : { text },
    });
    return deepgramTranscript.flattenRead(body);
  },
});

function textList({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const items = Array.isArray(value) ? value : [value];
  const texts = items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
  if (texts.length > 100) {
    throw new Error(`${label} accepts at most 100 values.`);
  }
  return texts;
}
