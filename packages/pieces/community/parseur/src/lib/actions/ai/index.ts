import { listMailboxesAction } from './list-mailboxes';
import { getMailboxAction } from './get-mailbox';
import { createMailboxAction } from './create-mailbox';
import { updateMailboxAction } from './update-mailbox';
import { copyMailboxAction } from './copy-mailbox';
import { deleteMailboxAction } from './delete-mailbox';
import { getMailboxSchemaAction } from './get-mailbox-schema';
import { listCustomDownloadsAction } from './list-custom-downloads';
import { createCustomDownloadAction } from './create-custom-download';
import { updateCustomDownloadAction } from './update-custom-download';
import { deleteCustomDownloadAction } from './delete-custom-download';
import { listTemplatesAction } from './list-templates';
import { getTemplateAction } from './get-template';
import { copyTemplateAction } from './copy-template';
import { deleteTemplateAction } from './delete-template';
import { getOptionValuesAction } from './get-option-values';
import { copyDocumentAction } from './copy-document';
import { deleteDocumentAction } from './delete-document';
import { getDocumentAction } from './get-document';
import { getDocumentLogsAction } from './get-document-logs';
import { listDocumentsAction } from './list-documents';
import { reprocessDocumentAction } from './reprocess-document';
import { skipDocumentAction } from './skip-document';
import { uploadEmailDocumentAction } from './upload-email-document';
import { uploadFileDocumentAction } from './upload-file-document';

export const parseurAiActions = [
  listDocumentsAction,
  getDocumentAction,
  uploadEmailDocumentAction,
  uploadFileDocumentAction,
  reprocessDocumentAction,
  skipDocumentAction,
  copyDocumentAction,
  deleteDocumentAction,
  getDocumentLogsAction,
  listMailboxesAction,
  getMailboxAction,
  createMailboxAction,
  updateMailboxAction,
  copyMailboxAction,
  deleteMailboxAction,
  getMailboxSchemaAction,
  listCustomDownloadsAction,
  createCustomDownloadAction,
  updateCustomDownloadAction,
  deleteCustomDownloadAction,
  listTemplatesAction,
  getTemplateAction,
  copyTemplateAction,
  deleteTemplateAction,
  getOptionValuesAction,
];
