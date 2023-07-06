
import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { convertJsonToXml } from "./lib/actions/convert-json-to-xml";

export const xml = createPiece({
  displayName: "XML",
  logoUrl: "https://cdn.activepieces.com/pieces/xml.png",
  auth: PieceAuth.None(),
  authors: ["Willianwg"],
  actions: [convertJsonToXml],
  triggers: [],
});
