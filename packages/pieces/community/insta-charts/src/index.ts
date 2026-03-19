import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { instaChartsGenerateChartImageAction } from "./lib/actions/generate-chart-image";
import { instaChartsAuth } from './lib/auth';

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