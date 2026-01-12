import { createAction, Property } from '@activepieces/pieces-framework';
import { googleGeminiAuth } from '../..';
import { GoogleGenAI } from '@google/genai';
import wav from 'wav';
import { Writable } from 'stream';

export const textToSpeechAction = createAction({
  name: 'text-to-speech',
  auth: googleGeminiAuth,
  displayName: 'Text to Speech',
  description: 'Converts text to audio file.',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Gemini 2.5 Pro Preview TTS ',
            value: 'gemini-2.5-pro-preview-tts',
          },
          {
            label: 'Gemini 2.5 Flash Preview TTS',
            value: 'gemini-2.5-flash-preview-tts',
          },
        ],
      },
    }),
    text: Property.LongText({
      displayName: 'Input Text',
      required: true,
    }),
    voice: Property.StaticDropdown({
      displayName: 'Voice',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Zephyr (Bright)', value: 'Zephyr' },
          { label: 'Puck (Upbeat)', value: 'Puck' },
          { label: 'Charon (Informative)', value: 'Charon' },
          { label: 'Kore (Firm)', value: 'Kore' },
          { label: 'Fenrir (Excitable)', value: 'Fenrir' },
          { label: 'Leda (Youthful)', value: 'Leda' },
          { label: 'Orus (Firm)', value: 'Orus' },
          { label: 'Aoede (Breezy)', value: 'Aoede' },
          { label: 'Callirrhoe (Easy-going)', value: 'Callirrhoe' },
          { label: 'Autonoe (Bright)', value: 'Autonoe' },
          { label: 'Enceladus (Breathy)', value: 'Enceladus' },
          { label: 'Iapetus (Clear)', value: 'Iapetus' },
          { label: 'Umbriel (Easy-going)', value: 'Umbriel' },
          { label: 'Algieba (Smooth)', value: 'Algieba' },
          { label: 'Despina (Smooth)', value: 'Despina' },
          { label: 'Erinome (Clear)', value: 'Erinome' },
          { label: 'Algenib (Gravelly)', value: 'Algenib' },
          { label: 'Rasalgethi (Informative)', value: 'Rasalgethi' },
          { label: 'Laomedeia (Upbeat)', value: 'Laomedeia' },
          { label: 'Achernar (Soft)', value: 'Achernar' },
          { label: 'Alnilam (Firm)', value: 'Alnilam' },
          { label: 'Schedar (Even)', value: 'Schedar' },
          { label: 'Gacrux (Mature)', value: 'Gacrux' },
          { label: 'Pulcherrima (Forward)', value: 'Pulcherrima' },
          { label: 'Achird (Friendly)', value: 'Achird' },
          { label: 'Zubenelgenubi (Casual)', value: 'Zubenelgenubi' },
          { label: 'Vindemiatrix (Gentle)', value: 'Vindemiatrix' },
          { label: 'Sadachbia (Lively)', value: 'Sadachbia' },
          { label: 'Sadaltager (Knowledgeable)', value: 'Sadaltager' },
          { label: 'Sulafat (Warm)', value: 'Sulafat' },
        ],
      },
    }),
  },
  async run(context) {
    const { text, model, voice } = context.propsValue;

    try {
      const genAI = new GoogleGenAI({ apiKey: context.auth.secret_text });

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const data =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!data) {
        throw new Error('No audio data returned from model response.');
      }

      const pcmBuffer = Buffer.from(data, 'base64');
      const wavBuffer = await pcmToWavBuffer(pcmBuffer, 1, 24000, 2);

      return await context.files.write({
        data: wavBuffer,
        fileName: 'audio.wav',
      });

    } catch (error) {
      console.error('Error in generate content from image:', error);
      throw error;
    }
  },
});

export async function pcmToWavBuffer(
  pcmBuffer: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const wavBuffers: Buffer[] = [];

    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const writable = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        wavBuffers.push(chunk);
        callback();
      },
    });

    writer.pipe(writable);
    writer.write(pcmBuffer);
    writer.end();

    writer.on('finish', () => {
      const fullWavBuffer = Buffer.concat(wavBuffers);
      resolve(fullWavBuffer);
    });

    writer.on('error', (err) => reject(err));
  });
}
