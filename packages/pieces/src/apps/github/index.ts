import {createPiece} from '../../framework/piece';
import {githubNewRepoEvent} from "./trigger/new-star";

export const github = createPiece({
	name: 'github',
	displayName: "Github",
	logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
	actions: [],
	triggers: [githubNewRepoEvent],
});
