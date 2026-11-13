import { deleteFileAction } from './delete-file';
import { downloadReportAction } from './download-report';
import { getCreditsAction } from './get-credits';
import { getFileAction } from './get-file';
import { listFilesAction } from './list-files';
import { stopFileAction } from './stop-file';
import { uploadFileAction } from './upload-file';
import { verifyEmailAiAction } from './verify-email';

export const millionVerifierAiActions = [
  verifyEmailAiAction,
  getCreditsAction,
  uploadFileAction,
  getFileAction,
  listFilesAction,
  downloadReportAction,
  stopFileAction,
  deleteFileAction,
];
