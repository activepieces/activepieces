
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { createNewIssue } from "./lib/actions/create-new-issue";

export const jira = createPiece({
  name: "jira",
  displayName: "Jira",
  logoUrl: "https://cdn.activepieces.com/pieces/jira.png",
  version: packageJson.version,
  authors: [],
  actions: [
    createNewIssue
  ],
  triggers: [],
});
