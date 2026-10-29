import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { nuelinkAuths } from './lib/auth';
import { createPost } from './lib/actions/create-post';
import { createCollectionPost } from './lib/actions/create-collection-post';
import { updatePost } from './lib/actions/update-post';
import { deletePost } from './lib/actions/delete-post';
import { listPosts } from './lib/actions/list-posts';
import { listPublishedPosts } from './lib/actions/list-published-posts';
import { uploadMedia } from './lib/actions/upload-media';
import { aiListBrands } from './lib/actions/ai/list-brands';
import { aiListCollections } from './lib/actions/ai/list-collections';
import { aiGetMe } from './lib/actions/ai/get-me';
import { aiGetSchedule } from './lib/actions/ai/get-schedule';
import { aiListChannels } from './lib/actions/ai/list-channels';
import { aiCreateCollection } from './lib/actions/ai/create-collection';
import { aiUpdateCollection } from './lib/actions/ai/update-collection';
import { aiAddCollectionChannel } from './lib/actions/ai/add-collection-channel';
import { aiRemoveCollectionChannel } from './lib/actions/ai/remove-collection-channel';
import { aiAddCollectionQueueSlot } from './lib/actions/ai/add-collection-queue-slot';
import { aiDeleteCollectionQueueSlot } from './lib/actions/ai/delete-collection-queue-slot';
import { aiListAutomations } from './lib/actions/ai/list-automations';
import { aiCreateAutomation } from './lib/actions/ai/create-automation';
import { aiUpdateAutomationStatus } from './lib/actions/ai/update-automation-status';
import { aiListMedia } from './lib/actions/ai/list-media';
import { aiUploadFile } from './lib/actions/ai/upload-file';
import { aiCreatePost } from './lib/actions/ai/create-post';
import { aiUpdatePost } from './lib/actions/ai/update-post';
import { aiMovePosts } from './lib/actions/ai/move-posts';
import { aiDeletePost } from './lib/actions/ai/delete-post';
import { aiListBrandPosts } from './lib/actions/ai/list-brand-posts';
import { aiListPublishedPosts } from './lib/actions/ai/list-published-posts';
import { newPublishedPost } from './lib/triggers/new-published-post';

export const nuelink = createPiece({
  displayName: 'Nuelink',
  description: 'Social media scheduling: create, schedule, edit and track posts across your Nuelink brands and collections.',
  auth: nuelinkAuths,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/nuelink.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.MARKETING],
  authors: ['AouladLahceneOussama'],
  actions: [
    createCollectionPost,
    updatePost,
    deletePost,
    listPosts,
    listPublishedPosts,
    uploadMedia,
    createPost,
    aiListBrands,
    aiListCollections,
    aiGetMe,
    aiGetSchedule,
    aiListChannels,
    aiCreateCollection,
    aiUpdateCollection,
    aiAddCollectionChannel,
    aiRemoveCollectionChannel,
    aiAddCollectionQueueSlot,
    aiDeleteCollectionQueueSlot,
    aiListAutomations,
    aiCreateAutomation,
    aiUpdateAutomationStatus,
    aiListMedia,
    aiUploadFile,
    aiCreatePost,
    aiUpdatePost,
    aiMovePosts,
    aiDeletePost,
    aiListBrandPosts,
    aiListPublishedPosts,
  ],
  triggers: [newPublishedPost],
});
