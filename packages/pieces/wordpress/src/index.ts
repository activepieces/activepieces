import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { createWordpressPost } from './lib/actions/create-post.action';
import { wordpressNewPost } from './lib/trigger/new-post.trigger';
export const wordpress = createPiece({
	name: 'wordpress',
	displayName: 'Wordpress',
	logoUrl: 'https://cdn.activepieces.com/pieces/wordpress.png',
	version: packageJson.version,
	type: PieceType.PUBLIC,
	actions: [createWordpressPost],
	triggers: [wordpressNewPost],
});
