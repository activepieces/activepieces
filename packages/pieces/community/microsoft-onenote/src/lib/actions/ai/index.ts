import { copyNotebookAction } from './copy-notebook';
import { copyPageToSectionAction } from './copy-page-to-section';
import { copySectionToNotebookAction } from './copy-section-to-notebook';
import { copySectionToSectionGroupAction } from './copy-section-to-section-group';
import { createNotebookAiAction } from './create-notebook';
import { createPageAiAction } from './create-page';
import { createSectionAiAction } from './create-section';
import { createSectionGroupAction } from './create-section-group';
import { deletePageAction } from './delete-page';
import { getNotebookAction } from './get-notebook';
import { getNotebookFromWebUrlAction } from './get-notebook-from-web-url';
import { getOperationAction } from './get-operation';
import { getPageAction } from './get-page';
import { getPageContentAction } from './get-page-content';
import { getPagePreviewAction } from './get-page-preview';
import { getRecentNotebooksAction } from './get-recent-notebooks';
import { getResourceContentAction } from './get-resource-content';
import { getSectionAction } from './get-section';
import { getSectionGroupAction } from './get-section-group';
import { listNotebooksAction } from './list-notebooks';
import { listPagesAction } from './list-pages';
import { listSectionGroupsAction } from './list-section-groups';
import { listSectionsAction } from './list-sections';
import { updatePageContentAction } from './update-page-content';

export const microsoftOneNoteAiActions = [
  listNotebooksAction,
  getNotebookAction,
  createNotebookAiAction,
  copyNotebookAction,
  getNotebookFromWebUrlAction,
  getRecentNotebooksAction,
  listSectionGroupsAction,
  getSectionGroupAction,
  createSectionGroupAction,
  listSectionsAction,
  getSectionAction,
  createSectionAiAction,
  copySectionToNotebookAction,
  copySectionToSectionGroupAction,
  listPagesAction,
  getPageAction,
  getPageContentAction,
  getPagePreviewAction,
  createPageAiAction,
  updatePageContentAction,
  deletePageAction,
  copyPageToSectionAction,
  getResourceContentAction,
  getOperationAction,
];
