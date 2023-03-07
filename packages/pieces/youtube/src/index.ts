
    import { createPiece } from '@activepieces/framework';
    import packageJson from '../package.json';
import { youtubeNewVideoTrigger } from './lib/triggers/new-video.trigger';

    export const youtube = createPiece({
      name: 'youtube',
      displayName: 'youtube',
      logoUrl: 'https://cdn.activepieces.com/pieces/youtube.png',
      version: packageJson.version,
      authors: [
      ],
      actions: [
      ],
      triggers: [
        youtubeNewVideoTrigger,
      ],
    });
  