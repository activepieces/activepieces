import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { createWordpressPost } from './lib/actions/create-post.action';
import { wordpressNewPost } from './lib/trigger/new-post.trigger';
import { createWordpressPage } from './lib/actions/create-page.action';

// TODO This needs a better description
const markdownPropertyDescription = `
Enable basic authentication for your Wordpress website by downloading and installing the plugin from this repository: https://github.com/WP-API/Basic-Auth.
`

export const wordpressAuth = PieceAuth.CustomAuth({
    displayName: '',
    description: markdownPropertyDescription,
    required: true,
    props: {
        username: Property.ShortText({
            displayName: "Username",
            required: true
        }),
        password: PieceAuth.SecretText({
            displayName: "Password",
            required: true,
        }),
        website_url: Property.ShortText({
            displayName: 'Website URL',
            required: true,
            description: "URL of the wordpress url i.e https://www.example-website.com"
        }),
    }
})

export const wordpress = createPiece({
	displayName: 'Wordpress',
	    minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/wordpress.png',
    auth: wordpressAuth,
	actions: [createWordpressPost, createWordpressPage],
	triggers: [wordpressNewPost],
});
