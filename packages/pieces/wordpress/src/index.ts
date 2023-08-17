import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { createWordpressPost } from './lib/actions/create-post.action';
import { wordpressNewPost } from './lib/trigger/new-post.trigger';
import { createWordpressPage } from './lib/actions/create-page.action';

const markdownPropertyDescription = `
** Enable Basic Authentication: **

1. Download the plugin from: https://github.com/WP-API/Basic-Auth (Click on Code -> Download Zip)
2. Log in to your Wordpress dashboard.
3. Go to "Plugins" and click "Add New."
4. Choose "Upload Plugin" and select the downloaded file.
5. Install and activate the plugin.
`

export const wordpressAuth = PieceAuth.CustomAuth({
    displayName: 'Authentication',
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
