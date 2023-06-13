import { createPiece } from "@activepieces/pieces-framework";
import { newSubmission } from "./lib/triggers/new-submission";

export const jotform = createPiece({
	displayName: "Jotform",
	logoUrl: "https://cdn.activepieces.com/pieces/jotform.svg",
	authors: ['MoShizzle'],
	actions: [],
	triggers: [newSubmission],
});
