import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { instaChartsGenerateChartImageAction } from "./lib/actions/generate-chart-image";

export const instaChartsAuth = PieceAuth.OAuth2({
  description: 'InstaCharts OAuth2 Authentication',
  authUrl: 'https://api.instacharts.io/v1/oauth/authorize',
  tokenUrl: 'https://api.instacharts.io/v1/oauth/token',
  required: true,
  scope: ['read', 'write'],
});

export const instaCharts = createPiece({
  displayName: "InstaCharts",
  description: "Chart creation and visualization platform",
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/insta-charts.png",
  categories: [PieceCategory.MARKETING, PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david'],
  auth: instaChartsAuth,
  actions: [
    instaChartsGenerateChartImageAction,
  ],
  triggers: [],
});