import createFolder from './create-folder';
import createPaste from './create-paste';
import deleteFolder from './delete-folder';
import deletePaste from './delete-paste';
import editPaste from './edit-paste';
import getFolder from './get-folder';
import getFolderHierarchy from './get-folder-hierarchy';
import getPaste from './get-paste';

export default [
  createPaste,
  getPaste,
  editPaste,
  deletePaste,
  createFolder,
  getFolder,
  getFolderHierarchy,
  deleteFolder,
];
