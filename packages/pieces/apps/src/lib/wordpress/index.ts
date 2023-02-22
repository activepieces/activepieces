import { createPiece } from '@activepieces/framework';
import { createWordpressPost } from './actions/create-post.action';
import { wordpressNewPost } from './trigger/new-post.trigger';
export const wordpress = createPiece({
	name: 'wordpress',
	displayName: 'Wordpress',
	logoUrl: 'https://cdn.activepieces.com/pieces/wordpress.png',
  version: '0.0.0',
	actions: [createWordpressPost],
	triggers: [wordpressNewPost],
});
