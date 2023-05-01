import { getFileAction } from './lib/actions/get-file-action';
import { getCommentsAction } from './lib/actions/get-comments-action';
import packageJson from "../package.json";
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import { postCommentAction } from './lib/actions/post-comment-action';
import { newCommentTrigger } from './lib/trigger/new-comment';

export const figma = createPiece({
	name: 'figma',
	displayName: "Figma",
	logoUrl: 'https://cdn.activepieces.com/pieces/figma.png',
	version: packageJson.version,
	type: PieceType.PUBLIC,
	actions: [
		getFileAction,
		getCommentsAction,
		postCommentAction,
	],
	triggers: [
		newCommentTrigger,
	]
});
