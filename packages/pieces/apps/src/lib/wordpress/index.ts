import { createPiece } from '@activepieces/framework';
import { wordpressNewPost } from './trigger/new-record.trigger';


export const wordpress = createPiece({
	name: 'wordpress',
	displayName: 'Wordpress',
	logoUrl: 'https://cdn.activepieces.com/pieces/wordpress.png',
	actions: [],
	triggers: [wordpressNewPost],
});
