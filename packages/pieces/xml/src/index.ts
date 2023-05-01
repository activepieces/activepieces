
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import { convertJsonToXml } from "./lib/actions/convert-json-to-xml";
import packageJson from "../package.json";

export const xml = createPiece({
  name: "xml",
  displayName: "XML",
  logoUrl: "https://cdn.activepieces.com/pieces/xml.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ["Willianwg"],
  actions: [convertJsonToXml],
  triggers: [],
});
