
import { createPiece } from "@activepieces/pieces-framework";
import { createFile } from "./lib/actions/create-file";

export const sftp = createPiece({
  displayName: "SFTP",
  logoUrl: "https://cdn.activepieces.com/pieces/sftp.png",
  authors: ["Abdallah-Alwarawreh"],
  actions: [createFile],
  triggers: [],
});
