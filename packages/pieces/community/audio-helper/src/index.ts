import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

// Imposta la path di FFmpeg (necessario per funzionare su tutti gli ambienti)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Importeremo qui le azioni man mano che le creiamo
import { convertAudioFormat } from './lib/actions/convert-format.action';

export const audioHelper = createPiece({
  displayName: 'Audio Helper',
  description: 'Tools for advanced audio manipulation using FFmpeg',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/audio-helper.png',
  authors: ["lau90eth"],
  categories: [PieceCategory.CORE],
  actions: [
    convertAudioFormat,
    // qui aggiungeremo le altre azioni (trim, metadata, ecc.)
  ],
  triggers: [],
});
