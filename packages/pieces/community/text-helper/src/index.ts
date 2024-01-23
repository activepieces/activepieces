import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { concat } from './lib/actions/concat';
import { replace } from './lib/actions/replace';
import { split } from './lib/actions/split';
import { find } from './lib/actions/find';
import { markdownToHTML } from './lib/actions/markdown-to-html';
import { htmlToMarkdown } from './lib/actions/html-to-markdown';

export const textHelper = createPiece({
  displayName: 'Text Helper',
  auth: PieceAuth.None(),
  logoUrl: 'https://cdn.activepieces.com/pieces/text-helper.svg',
  authors: ['abaza738', 'joeworkman', 'AbdulTheActivePiecer'],
  actions: [concat, replace, split, find, markdownToHTML, htmlToMarkdown],
  triggers: [],
});
