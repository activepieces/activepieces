import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { adjustNumberAction } from './lib/actions/adjust-number';
import { adjustNumberByIdAction } from './lib/actions/ai/adjust-number-by-id';
import { cloneObjectByIdAction } from './lib/actions/ai/clone-object-by-id';
import { createObjectByIdAction } from './lib/actions/ai/create-object-by-id';
import { findObjectsByIdAction } from './lib/actions/ai/find-objects-by-id';
import { getCollectionFieldsByIdAction } from './lib/actions/ai/get-collection-fields-by-id';
import { getObjectByIdAction } from './lib/actions/ai/get-object-by-id';
import { updateObjectByIdAction } from './lib/actions/ai/update-object-by-id';
import { uploadFileByIdAction } from './lib/actions/ai/upload-file-by-id';
import { cloneObjectAction } from './lib/actions/clone-object';
import { createObjectAction } from './lib/actions/create-object';
import { deleteObjectAction } from './lib/actions/delete-object';
import { findObjectsAction } from './lib/actions/find-objects';
import { getBlogPostAction } from './lib/actions/get-blog-post';
import { getCollectionSchemaAction } from './lib/actions/get-collection-schema';
import { getContentAction } from './lib/actions/get-content';
import { listCollectionsAction } from './lib/actions/list-collections';
import { saveBlogGalleryAction } from './lib/actions/save-blog-gallery';
import { saveBlogImageAction } from './lib/actions/save-blog-image';
import { saveBlogPostAction } from './lib/actions/save-blog-post';
import { saveDateAction } from './lib/actions/save-date';
import { saveDepotAction } from './lib/actions/save-depot';
import { saveFileAction } from './lib/actions/save-file';
import { saveGalleryAction } from './lib/actions/save-gallery';
import { saveImageAction } from './lib/actions/save-image';
import { saveTextAction } from './lib/actions/save-text';
import { saveToggleAction } from './lib/actions/save-toggle';
import { saveVideoAction } from './lib/actions/save-video';
import { updateObjectAction } from './lib/actions/update-object';
import { uploadFileAction } from './lib/actions/upload-file';
import { cmsAuth, totalcmsBaseUrl } from './lib/auth';
import { newBlogPost } from './lib/triggers/new-blog-post';
import { newObjectTrigger } from './lib/triggers/new-object';
import { updatedObjectTrigger } from './lib/triggers/updated-object';

export const totalcms = createPiece({
  displayName: 'Total CMS',
  description: 'Flat-file content management system for websites, with collections, blogs, images and files.',
  auth: cmsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/totalcms.png',
  categories: [PieceCategory.MARKETING],
  authors: ['joeworkman', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    listCollectionsAction,
    getCollectionSchemaAction,
    findObjectsAction,
    getContentAction,
    getObjectByIdAction,
    createObjectAction,
    updateObjectAction,
    updateObjectByIdAction,
    cloneObjectAction,
    deleteObjectAction,
    uploadFileAction,
    adjustNumberAction,
    getBlogPostAction,
    saveBlogPostAction,
    saveBlogImageAction,
    saveBlogGalleryAction,
    saveTextAction,
    saveToggleAction,
    saveDateAction,
    saveImageAction,
    saveGalleryAction,
    saveFileAction,
    saveDepotAction,
    saveVideoAction,
    getCollectionFieldsByIdAction,
    findObjectsByIdAction,
    createObjectByIdAction,
    uploadFileByIdAction,
    adjustNumberByIdAction,
    cloneObjectByIdAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        return `${totalcmsBaseUrl(auth.props.domain)}/api`;
      },
      auth: cmsAuth,
      authMapping: async (auth) => ({
        'X-API-Key': auth.props.apiKey.trim(),
      }),
    }),
  ],
  triggers: [newBlogPost, newObjectTrigger, updatedObjectTrigger],
});
