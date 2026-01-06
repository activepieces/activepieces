import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { chartlyAuth } from "./lib/common/auth";
import { createChartAction } from "./lib/actions/create-chart";
import { getChartAction } from "./lib/actions/get-chart";

export const chartly = createPiece({
  displayName: "Chartly",
  description: "Instant chart images. Zero servers. Transform any Chart.js configuration into cached PNG or SVG images via a simple REST API.",
  auth: chartlyAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.CONTENT_AND_FILES],
  logoUrl: "https://cdn.activepieces.com/pieces/chartly.png",
  authors: ['onyedikachi-david'],
  actions: [createChartAction, getChartAction],
  triggers: [],
});
