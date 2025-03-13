import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { searchKnowledgeBase } from "./lib/actions/search-knowledge-base";

export const knowledgeBase = createPiece({
  displayName: "Avalant Knowledge Base",
  description: "Search for content in Avalant's knowledge base",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://i.ibb.co/PZm04qwf/book-open-solid.png",
  authors: ["rupalbarman"],
  actions: [searchKnowledgeBase],
  triggers: [],
});
