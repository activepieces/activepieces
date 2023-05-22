import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { createWordpressPost } from './lib/actions/create-post.action';
import { wordpressNewPost } from './lib/trigger/new-post.trigger';
import { createWordpressPage } from './lib/actions/create-page.action';
export const wordpress = createPiece({
	name: 'wordpress',
	displayName: 'Wordpress',
	logoUrl: 'https://cdn.activepieces.com/pieces/wordpress.png',
	version: packageJson.version,
	actions: [createWordpressPost, createWordpressPage],
	triggers: [wordpressNewPost],
});
