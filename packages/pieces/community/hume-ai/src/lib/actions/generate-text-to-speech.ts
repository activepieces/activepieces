import { Property, createAction } from '@activepieces/pieces-framework';
import { HumeClient } from 'hume';
import { humeAiAuth } from '../common/auth';

export const generateTextToSpeech = createAction({
  name: 'generate_text_to_speech',
  classification: 'READ',
  displayName: 'Generate Text to Speech',
  description: 'Turn text into expressive speech, with up to 5 versions to pick from.',
  audience: 'both',
  aiMetadata: {
    description: 'Synthesize expressive speech audio from text via Hume AI and return it as an audio file (mp3/wav/pcm). Optionally steer the voice with a natural-language description (omit to generate a dynamic voice) and request multiple generations in one call. Use to produce spoken audio from a text string. Each call generates fresh audio, so it is not idempotent.',
    idempotent: false,
  },
  auth: humeAiAuth,
  propertyGroups: [
    { key: 'speech', display: 'section', label: 'Speech', icon: 'type', props: ['text', 'voiceDescription'] },
    { key: 'audio', display: 'section', label: 'Audio', icon: 'sliders', props: ['format', 'speed', 'numGenerations'] },
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
    numGenerations: Property.Number({
      displayName: 'Number of Versions',
      description: 'How many versions to make (1 to 5). Over 1 also returns their IDs.',
      required: false,
      defaultValue: 1,
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
          generationId: gen.generationId,
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
        generationId: firstGeneration.generationId,
        audioDurationSeconds: firstGeneration.duration,
        audioSizeBytes: firstGeneration.fileSize,
        allGenerations: allGenerations,
      };
    } catch (error) {
      throw new Error(`Text-to-speech generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
