import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const generateSpeechFromFile = createAction({
  name: 'generate_speech_from_file',
  displayName: 'Generate Speech from File',
  description: 'Convert audio file to speech using Hume AI\'s expressive text-to-speech technology',
  auth: humeAiAuth,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to convert to speech',
      required: true,
    }),
    voiceDescription: Property.LongText({
      displayName: 'Voice Description',
      description: 'Natural language description of how the speech should sound (tone, accent, style, etc.). If no voice is specified, this will generate a dynamic voice.',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Audio Format',
      description: 'The output audio file format',
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
          { label: 'PCM', value: 'pcm' },
        ],
      },
      required: true,
      defaultValue: 'mp3',
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: 'Speed multiplier for the synthesized speech (0.75-1.5 recommended)',
      required: false,
      defaultValue: 1.0,
    }),
    contextText: Property.LongText({
      displayName: 'Context Text',
      description: 'Optional context text to influence speech style and prosody consistency',
      required: false,
    }),
    contextDescription: Property.LongText({
      displayName: 'Context Description',
      description: 'Description for the context text (how it should sound)',
      required: false,
    }),
    trailingSilence: Property.Number({
      displayName: 'Trailing Silence (seconds)',
      description: 'Duration of silence to add at the end of the speech',
      required: false,
    }),
    splitUtterances: Property.Checkbox({
      displayName: 'Split Utterances',
      description: 'Automatically split text into natural-sounding speech segments',
      required: false,
      defaultValue: true,
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
