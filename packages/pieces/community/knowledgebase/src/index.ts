import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { searchKnowledgebase } from './lib/actions/search-knowledgebase';

export const knowledgebase = createPiece({
  displayName: "Knowledgebase",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://i.ibb.co/PZm04qwf/book-open-solid.png",
  authors: [],
  actions: [searchKnowledgebase],
  triggers: [],
});

export default knowledgebase;
