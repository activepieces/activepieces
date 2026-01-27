import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const generateTextToSpeech = createAction({
  name: 'generate_text_to_speech',
  displayName: 'Generate Text to Speech',
  description: "Convert text to speech using Hume AI's expressive text-to-speech technology",
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
    numGenerations: Property.Number({
      displayName: 'Number of Generations',
      description: 'Number of audio generations to produce (1-5 recommended)',
      required: false,
      defaultValue: 1,
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
      numGenerations,
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
      ...(numGenerations && numGenerations !== 1 && { numGenerations }),
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
      const response = await client.tts.synthesizeJson(request);

      const firstGeneration = response.generations[0];
      if (!firstGeneration || !firstGeneration.audio) {
        throw new Error('No audio generated');
      }

      const audioBuffer = Buffer.from(firstGeneration.audio, 'base64');

      if (response.generations.length === 1) {
        return await context.files.write({
          data: audioBuffer,
          fileName: `tts_${Date.now()}.${format}`,
        });
      }

      const filePromises = response.generations.map(async (gen, index) => {
        const genBuffer = Buffer.from(gen.audio, 'base64');
        const file = await context.files.write({
          data: genBuffer,
          fileName: `tts_gen_${index + 1}_${Date.now()}.${format}`,
        });
        return {
          file: file,
          durationSeconds: gen.duration,
          sizeBytes: gen.fileSize,
        };
      });

      const allGenerations = await Promise.all(filePromises);

      return {
        primaryFile: await context.files.write({
          data: audioBuffer,
          fileName: `tts_primary_${Date.now()}.${format}`,
        }),
        format: format,
        requestId: response.requestId,
        audioDurationSeconds: firstGeneration.duration,
        audioSizeBytes: firstGeneration.fileSize,
        allGenerations: allGenerations,
      };
    } catch (error) {
      throw new Error(`Text-to-speech generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
