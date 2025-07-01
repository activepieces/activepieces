
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { airtopApiCall } from './lib/common';
import { airtopCreateSessionAction } from './lib/actions/create-session';
import { airtopTerminateSessionAction } from "./lib/actions/terminate-session";
import { airtopCreateWindowAction } from "./lib/actions/create-window";
import { airtopPageQueryAction } from "./lib/actions/page-query";
import { airtopSmartScrapeAction } from "./lib/actions/smart-scrape";
import { airtopTakeScreenshotAction } from "./lib/actions/take-screenshot";
import { airtopPaginatedExtractionAction } from "./lib/actions/paginated-extraction";
import { airtopClickElementAction } from "./lib/actions/click-element";
import { airtopTypeAction } from "./lib/actions/type";
import { airtopUploadFileAction } from "./lib/actions/upload-file";
import { airtopHoverOnElementAction } from "./lib/actions/hover-on-element";

export const airtopAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can find your API key in the Airparser dashboard under Account Settings.',
  validate: async ({ auth }) => {
    try {
      await airtopApiCall({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/inboxes',
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});

export const airtop = createPiece({
  displayName: "Airtop",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/airtop.png",
  authors: [],
  actions: [
    airtopCreateSessionAction,
    airtopTerminateSessionAction,
    airtopCreateWindowAction,
    airtopPageQueryAction,
    airtopSmartScrapeAction,
    airtopTakeScreenshotAction,
    airtopPaginatedExtractionAction,
    airtopClickElementAction,
    airtopTypeAction,
    airtopUploadFileAction,
    airtopHoverOnElementAction
  ],
  triggers: [],
});

