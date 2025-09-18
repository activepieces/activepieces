
    import { createPiece } from "@activepieces/pieces-framework";
    import { magicslidesAuth } from './lib/common/auth';
    import { createPptFromYoutubeVideo } from './lib/actions/create-ppt-from-youtube-video';
    import { createPptFromSummary } from './lib/actions/create-ppt-from-summary';
    import { createPptFromTopic } from './lib/actions/create-ppt-from-topic';

    export const magicSlides = createPiece({
      displayName: 'Magic-slides',
      auth: magicslidesAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/magic-slides.png',
      authors: ['Prabhukiran161'],
      actions: [
        createPptFromYoutubeVideo,
        createPptFromSummary,
        createPptFromTopic,
      ],
      triggers: [],
    });
    