import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { newSubmission } from "./lib/triggers/new-submission";

export const jotform = createPiece({
	name: "jotform",
	displayName: "Jotform",
	logoUrl: "https://cdn.activepieces.com/pieces/jotform.svg",
	version: packageJson.version,
	authors: ['MoShizzle'],
	actions: [],
	triggers: [newSubmission],
});
