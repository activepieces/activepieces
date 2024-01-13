
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const hackerNews = createPiece({
  displayName: "Hacker-news",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/hacker-news.png",
  authors: [],
  actions: [],
  triggers: [],
});
