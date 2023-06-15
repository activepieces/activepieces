
import packageJson from "../package.json";
import { createPiece } from "@activepieces/pieces-framework";
import { webflowNewSubmission } from './lib/triggers/new-form-submitted';

export const webflow = createPiece({
  displayName: "Webflow",
  logoUrl: "https://cdn.activepieces.com/pieces/webflow.png",
  authors: ['Ahmad-AbuOsbeh'],
  actions: [],
  triggers: [webflowNewSubmission],
});
