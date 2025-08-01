
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { apitemplateCreateImageAction } from "./lib/actions/create-image";
import { apitemplateCreatePdfAction } from "./lib/actions/create-pdf";
import { apitemplateCreatePdfFromHtmlAction } from "./lib/actions/create-pdf-from-html";
import { apitemplateCreatePdfFromUrlAction } from "./lib/actions/create-pdf-from-url";
import { apitemplateCreatePdfAdvancedAction } from "./lib/actions/create-pdf-advanced";
import { apitemplateDeleteObjectAction } from "./lib/actions/delete-object";
import { apitemplateGetAccountInformationAction } from "./lib/actions/get-account-information";
import { apitemplateListObjectsAction } from "./lib/actions/list-objects";

export const apitemplateAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
    To obtain your API key, follow these steps:

    1. Sign up for an account at APITemplate.io
    2. Go to the web console under "API Integration" section
    3. Copy your API key
    4. Use this API key for authentication
  `,
});

export const apiTemplate = createPiece({
  displayName: "APITemplate.io",
  description: "Dynamic document automation platform that generates PDFs and images from templates and JSON data.",
  auth: apitemplateAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/api-template.png",
  authors: [],
          actions: [
          apitemplateCreateImageAction,
          apitemplateCreatePdfAction,
          apitemplateCreatePdfFromHtmlAction,
          apitemplateCreatePdfFromUrlAction,
          apitemplateCreatePdfAdvancedAction,
          apitemplateDeleteObjectAction,
          apitemplateGetAccountInformationAction,
          apitemplateListObjectsAction,
        ],
  triggers: [],
});
    