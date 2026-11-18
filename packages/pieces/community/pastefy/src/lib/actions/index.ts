import createFolderAi from './ai/create-folder-ai';
import createPasteAi from './ai/create-paste-ai';
import deleteFolderAi from './ai/delete-folder-ai';
import editPasteAi from './ai/edit-paste-ai';
import getFolderAi from './ai/get-folder-ai';
import listFolders from './ai/list-folders';
import createFolder from './create-folder';
import createPaste from './create-paste';
import deleteFolder from './delete-folder';
import deletePaste from './delete-paste';
import editPaste from './edit-paste';
import getFolder from './get-folder';
import getFolderHierarchy from './get-folder-hierarchy';
import getPaste from './get-paste';
import listMyPastes from './list-my-pastes';
import searchPublicPastes from './search-public-pastes';

export default [
  createPaste,
  getPaste,
  editPaste,
  deletePaste,
  createFolder,
  getFolder,
  getFolderHierarchy,
  deleteFolder,
  listMyPastes,
  searchPublicPastes,
  createPasteAi,
  editPasteAi,
  createFolderAi,
  getFolderAi,
  deleteFolderAi,
  listFolders,
];
