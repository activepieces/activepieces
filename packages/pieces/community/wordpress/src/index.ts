import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createWordPressPage } from './lib/actions/create-page.action';
import { createWordPressPost } from './lib/actions/create-post.action';
import { getWordPressPost } from './lib/actions/get-post.action';
import { wordpressCommon } from './lib/common';
import { wordpressNewPost } from './lib/trigger/new-post.trigger';
import { updateWordPressPost } from './lib/actions/update-post.action';
import { listPostsAction } from './lib/actions/list-posts.action';
import { getPostByIdAction } from './lib/actions/get-post-by-id.action';
import { createBlogPostAction } from './lib/actions/create-blog-post.action';
import { updateBlogPostAction } from './lib/actions/update-blog-post.action';
import { trashPostAction } from './lib/actions/trash-post.action';
import { deletePostPermanentlyAction } from './lib/actions/delete-post-permanently.action';
import { listPagesAction } from './lib/actions/list-pages.action';
import { getPageAction } from './lib/actions/get-page.action';
import { createSitePageAction } from './lib/actions/create-site-page.action';
import { updatePageAction } from './lib/actions/update-page.action';
import { trashPageAction } from './lib/actions/trash-page.action';
import { listCategoriesAction } from './lib/actions/list-categories.action';
import { createCategoryAction } from './lib/actions/create-category.action';
import { deleteCategoryAction } from './lib/actions/delete-category.action';
import { listTagsAction } from './lib/actions/list-tags.action';
import { createTagAction } from './lib/actions/create-tag.action';
import { deleteTagAction } from './lib/actions/delete-tag.action';
import { listCommentsAction } from './lib/actions/list-comments.action';
import { createCommentAction } from './lib/actions/create-comment.action';
import { moderateCommentAction } from './lib/actions/moderate-comment.action';
import { deleteCommentAction } from './lib/actions/delete-comment.action';
import { listMediaAction } from './lib/actions/list-media.action';
import { getMediaAction } from './lib/actions/get-media.action';
import { uploadMediaAction } from './lib/actions/upload-media.action';
import { updateMediaDetailsAction } from './lib/actions/update-media-details.action';
import { deleteMediaAction } from './lib/actions/delete-media.action';
import { getCurrentUserAction } from './lib/actions/get-current-user.action';
import { listUsersAction } from './lib/actions/list-users.action';
import { searchSiteContentAction } from './lib/actions/search-site-content.action';
import { getSiteSettingsAction } from './lib/actions/get-site-settings.action';

const markdownPropertyDescription = `
Connect with a WordPress **application password**:

1. In your WordPress admin, open **Users → Profile**.
2. Under **Application Passwords**, type a name and click **Add New Application Password**.
3. Copy the generated password and paste it below together with your username.

Your site must use HTTPS: the password travels with every request. On WordPress older than 5.6, install the [Basic Auth plugin](https://github.com/WP-API/Basic-Auth) and use your login password instead, still over HTTPS.
`;

export const wordpressAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
      description: 'The WordPress user the flow acts as.',
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
      description:
        'Application password, or the login password with the Basic Auth plugin.',
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description: 'Address of your WordPress site.',
      placeholder: 'https://example.com',
    }),
  },
  validate: async ({ auth }) => {
    const { username, password, website_url } = auth;
    if (!username || !password || !website_url) {
      return {
        valid: false,
        error: 'Please fill in the username, password and website URL.',
      };
    }
    if (!wordpressCommon.isBaseUrl(website_url.trim())) {
      return {
        valid: false,
        error:
          'Please ensure that the website is valid and does not contain any paths, for example, https://example-website.com.',
      };
    }
    const apiEnabled = await wordpressCommon.urlExists(
      website_url.trim() + '/wp-json'
    );
    if (!apiEnabled) {
      return {
        valid: false,
        error: `REST API is not reachable at ${website_url.trim()}/wp-json. In Settings → Permalinks pick any option other than "Plain", and disable security plugins that block the REST API.`,
      };
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${website_url.trim()}/wp-json/wp/v2/categories`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: username,
          password: password,
        },
      };
      await httpClient.sendRequest(request);
      return {
        valid: true,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        valid: false,
        error: 'Credentials are invalid. ' + message,
      };
    }
  },
});

export const wordpress = createPiece({
  displayName: 'WordPress',
  description: 'Open-source website creation software',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/wordpress.png',
  categories: [PieceCategory.MARKETING],
  auth: wordpressAuth,
  authors: [
    'pfernandez98',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
  ],
  actions: [
    createWordPressPost,
    createWordPressPage,
    updateWordPressPost,
    getWordPressPost,
    listPostsAction,
    getPostByIdAction,
    createBlogPostAction,
    updateBlogPostAction,
    trashPostAction,
    deletePostPermanentlyAction,
    listPagesAction,
    getPageAction,
    createSitePageAction,
    updatePageAction,
    trashPageAction,
    listCategoriesAction,
    createCategoryAction,
    deleteCategoryAction,
    listTagsAction,
    createTagAction,
    deleteTagAction,
    listCommentsAction,
    createCommentAction,
    moderateCommentAction,
    deleteCommentAction,
    listMediaAction,
    getMediaAction,
    uploadMediaAction,
    updateMediaDetailsAction,
    deleteMediaAction,
    getCurrentUserAction,
    listUsersAction,
    searchSiteContentAction,
    getSiteSettingsAction,
    createCustomApiCallAction({
      baseUrl: (auth) =>auth ?
        (auth.props.website_url).trim() + '/wp-json/wp/v2' : '',
      auth: wordpressAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${auth.props.username}:${
            auth.props.password
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: [wordpressNewPost],
});
