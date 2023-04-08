
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

export const matrix = createPiece({
  name: "matrix",
  displayName: "Matrix",
  logoUrl: "https://cdn.activepieces.com/pieces/matrix.png",
  version: packageJson.version,
  authors: ["abuaboud"],
  actions: [],
  triggers: [],
});
