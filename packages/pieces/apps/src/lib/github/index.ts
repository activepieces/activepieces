import { createPiece } from "@activepieces/framework";
import {githubNewRepoEvent} from "./trigger/new-star";

export const github = createPiece({
	name: 'github',
	displayName: "Github",
	logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
	authors: ['abuaboud'],
	actions: [],
	triggers: [githubNewRepoEvent],
});
