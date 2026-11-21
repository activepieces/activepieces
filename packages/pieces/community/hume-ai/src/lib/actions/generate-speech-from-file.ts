import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const generateSpeechFromFile = createAction({
  name: 'generate_speech_from_file',
  classification: 'READ',
  displayName: 'Generate Speech File',
  description: 'Turn text into one spoken audio file.',
  audience: 'both',
  aiMetadata: {
    description: 'Synthesize expressive speech from text via Hume AI and return a single downloadable audio file (mp3/wav/pcm). Like Generate Text to Speech but returns the raw audio file directly rather than JSON metadata; choose this when you just need the audio file output. Optionally steer the voice with a natural-language description. Each call generates fresh audio, so it is not idempotent.',
    idempotent: false,
  },
  auth: humeAiAuth,
  propertyGroups: [
    { key: 'speech', display: 'section', label: 'Speech', icon: 'type', props: ['text', 'voiceDescription'] },
    { key: 'audio', display: 'section', label: 'Audio', icon: 'sliders', props: ['format', 'speed'] },
  ],
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The words to speak.',
      placeholder: 'Thanks for calling. How can I help you today?',
      required: true,
    }),
    voiceDescription: Property.LongText({
      displayName: 'Voice Description',
      description: 'How the voice should sound. Empty: Hume creates a voice for the text.',
      placeholder: 'A calm, warm narrator who speaks slowly',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Audio Format',
      description: 'File type of the generated audio.',
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
          { label: 'PCM', value: 'pcm' },
        ],
      },
      required: true,
      defaultValue: 'mp3',
      width: 'half',
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: '1 is normal pace; 0.75 to 1.5 sounds most natural.',
      required: false,
      defaultValue: 1.0,
      width: 'half',
    }),
    contextText: Property.LongText({
      displayName: 'Context Text',
      description: 'Speech that comes just before, so style and pace carry over.',
      required: false,
      advanced: true,
    }),
    contextDescription: Property.LongText({
      displayName: 'Context Voice Description',
      description: 'How the context text sounds. Used only with Context Text.',
      required: false,
      advanced: true,
    }),
    trailingSilence: Property.Number({
      displayName: 'Trailing Silence',
      description: 'Seconds of silence to add at the end.',
      required: false,
      advanced: true,
    }),
    splitUtterances: Property.Checkbox({
      displayName: 'Split Into Phrases',
      description: 'Break the text into natural-sounding phrases before speaking.',
      required: false,
      defaultValue: true,
      advanced: true,
    }),
  },
  async run(context) {
    const client = new HumeClient({
      apiKey: context.auth.secret_text,
    });

    const {
      text,
      voiceDescription,
      format,
      speed,
      contextText,
      contextDescription,
      trailingSilence,
      splitUtterances,
    } = context.propsValue;

    const request: any = {
      utterances: [{
        text,
        ...(voiceDescription && { description: voiceDescription }),
        ...(speed && speed !== 1.0 && { speed }),
        ...(trailingSilence && { trailingSilence }),
      }],
      format: {
        type: format,
      },
      ...(splitUtterances !== undefined && { splitUtterances }),
    };

    if (contextText) {
      request.context = {
        utterances: [{
          text: contextText,
          ...(contextDescription && { description: contextDescription }),
        }],
      };
    }

    try {
      const response = await client.tts.synthesizeFile(request);

      const audioBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(audioBuffer);

      return await context.files.write({
        data: buffer,
        fileName: `speech_${Date.now()}.${format}`,
      });
    } catch (error) {
      throw new Error(`Speech file generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
