import { createPiece } from '@activepieces/pieces-framework';
import { askQuestion } from './lib/actions/ask-question';
import { createBot } from './lib/actions/create-bot';
import { createSource } from './lib/actions/create-source';
import { findBot } from './lib/actions/find-bot';
import { uploadSourceFile } from './lib/actions/upload-source-file';
import { docsbotAuth } from './lib/common';

export const docsbot = createPiece({
  displayName: 'DocsBot',
  description:
    'DocsBot AI allows you to build AI-powered chatbots that pull answers from your existing documentation and content. This integration enables workflows to ask DocsBot questions and update its training sources dynamically.',
  auth: docsbotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/docsbot.png',
  authors: ['LuizDMM'],
  actions: [
    askQuestion,
    createSource,
    uploadSourceFile,
    createBot,
    findBot,
  ],
  triggers: [],
});
