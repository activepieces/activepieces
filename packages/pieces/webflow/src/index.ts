
import packageJson from "../package.json";
import { createPiece } from "@activepieces/pieces-framework";
import { webflowNewSubmission } from './lib/triggers/new-form-submitted';

export const webflow = createPiece({
  name: "webflow",
  displayName: "Webflow",
  logoUrl: "https://cdn.activepieces.com/pieces/webflow.png",
  version: packageJson.version,
  authors: ['Ahmad-AbuOsbeh'],
  actions: [],
  triggers: [webflowNewSubmission],
});
