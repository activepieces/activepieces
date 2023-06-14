import { getFileAction } from './lib/actions/get-file-action';
import { getCommentsAction } from './lib/actions/get-comments-action';
import { createPiece } from "@activepieces/pieces-framework";
import { postCommentAction } from './lib/actions/post-comment-action';
import { newCommentTrigger } from './lib/trigger/new-comment';

export const figma = createPiece({
	displayName: "Figma",
	logoUrl: 'https://cdn.activepieces.com/pieces/figma.png',
	actions: [
		getFileAction,
		getCommentsAction,
		postCommentAction,
	],
	triggers: [
		newCommentTrigger,
	]
});
