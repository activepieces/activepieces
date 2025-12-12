import { createAction, Property } from '@activepieces/pieces-framework';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export const convertAudioFormat = createAction({
  name: 'convert-audio-format',
  displayName: 'Convert audio format',
  description: 'Convert an audio file to another format using FFmpeg.',
  props: {
    audio: Property.File({
      displayName: 'Audio file',
      description: 'The input audio file to convert.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Target format',
      description: 'Output audio format.',
      required: true,
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
          { label: 'OGG', value: 'ogg' },
          { label: 'FLAC', value: 'flac' },
        ],
      },
      defaultValue: 'mp3',
    }),
    bitrate: Property.ShortText({
      displayName: 'Bitrate (optional)',
      description: 'Example: 128k, 192k. If empty, FFmpeg will use a default.',
      required: false,
    }),
    resultFileName: Property.ShortText({
      displayName: 'Result file name (without extension)',
      description:
        'Base name for the output file. If empty, "audio-converted" will be used.',
      required: false,
    }),
  },
  async run(context) {
    const { audio, format, bitrate, resultFileName } = context.propsValue;

    // Creiamo una directory temporanea
    const tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'ap-audio-convert-'),
    );

    const inputPath = path.join(tmpDir, 'input');
    const outputPath = path.join(tmpDir, `output.${format}`);

    try {
      // Scriviamo il buffer del file audio su disco
      await fs.writeFile(inputPath, audio.data);

      // Eseguiamo FFmpeg per la conversione
      await new Promise<void>((resolve, reject) => {
        let command = ffmpeg(inputPath).toFormat(format);

        if (bitrate && bitrate.trim().length > 0) {
          command = command.audioBitrate(bitrate.trim());
        }

        command
          .on('end', () => {
            resolve();
          })
          .on('error', (err: any) => {
            reject(err);
          })
          .save(outputPath);
      });

      // Leggiamo il risultato in memoria
      const outputBuffer = await fs.readFile(outputPath);

      const baseName = resultFileName && resultFileName.trim().length > 0
        ? resultFileName.trim()
        : 'audio-converted';

      const fileName = `${baseName}.${format}`;

      // Scriviamo il file nel file storage di Activepieces
      const fileRef = await context.files.write({
        fileName,
        data: outputBuffer,
      });

      return fileRef;
    } finally {
      // Pulizia directory temporanea (non è grave se fallisce)
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  },
});
