import { getFileAction } from './lib/actions/get-file-action';
import { getCommentsAction } from './lib/actions/get-comments-action';
import { createPiece } from "@activepieces/framework";
import { postCommentAction } from './lib/actions/post-comment-action';
import { newCommentTrigger } from './lib/trigger/new-comment';

export const figma = createPiece({
	name: 'figma',
	displayName: "Figma",
	logoUrl: 'https://cdn.activepieces.com/pieces/figma.png',
  version: '0.0.0',
	actions: [
		getFileAction,
		getCommentsAction,
		postCommentAction,
  ],
	triggers: [
		newCommentTrigger,
	]
});
