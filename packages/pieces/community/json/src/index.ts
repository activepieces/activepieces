
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { convertTextToJson } from "./lib/actions/convert-text-to-json";
import { convertJsonToText } from "./lib/actions/convert-json-to-text";
import { runJsonataQuery } from "./lib/actions/run-jsonata-query";
import { mergeJson } from "./lib/actions/merge-json";

export const jsonAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use **test-key** as value for API Key',
});

export const json = createPiece({
  displayName: "JSON",
  description: "Convert JSON to text and vice versa",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/new-core/json-helper.svg",
  authors: ["leenmashni","abuaboud","bertrandong", 'sanket-a11y'],
  actions: [convertJsonToText, convertTextToJson, runJsonataQuery, mergeJson],
  triggers: [],
});
