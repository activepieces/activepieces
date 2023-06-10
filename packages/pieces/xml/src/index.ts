
import { createPiece } from "@activepieces/pieces-framework";
import { convertJsonToXml } from "./lib/actions/convert-json-to-xml";

export const xml = createPiece({
  displayName: "XML",
  logoUrl: "https://cdn.activepieces.com/pieces/xml.png",
  authors: ["Willianwg"],
  actions: [convertJsonToXml],
  triggers: [],
});
