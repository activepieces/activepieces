import { listAuthMethodsAction } from './auth-records/list-auth-methods';
import { createBackupAction } from './backups/create-backup';
import { deleteBackupAction } from './backups/delete-backup';
import { downloadBackupAction } from './backups/download-backup';
import { listBackupsAction } from './backups/list-backups';
import { restoreBackupAction } from './backups/restore-backup';
import { uploadBackupAction } from './backups/upload-backup';
import { createCollectionAction } from './collections/create-collection';
import { deleteCollectionAction } from './collections/delete-collection';
import { getCollectionAction } from './collections/get-collection';
import { importCollectionsAction } from './collections/import-collections';
import { listCollectionsAction } from './collections/list-collections';
import { previewViewQueryAction } from './collections/preview-view-query';
import { truncateCollectionAction } from './collections/truncate-collection';
import { updateCollectionAction } from './collections/update-collection';
import { listCronsAction } from './crons/list-crons';
import { runCronAction } from './crons/run-cron';
import { downloadFileAction } from './files/download-file';
import { deleteLogsAction } from './logs/delete-logs';
import { getLogAction } from './logs/get-log';
import { getLogStatsAction } from './logs/get-log-stats';
import { listLogsAction } from './logs/list-logs';
import { batchRecordsAction } from './records/batch-records';
import { getSettingsAction } from './settings/get-settings';
import { updateSettingsAction } from './settings/update-settings';
import { runSqlAction } from './sql/run-sql';

export const pocketbaseAiActions = [
  batchRecordsAction,
  listAuthMethodsAction,
  downloadFileAction,
  listCollectionsAction,
  getCollectionAction,
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  truncateCollectionAction,
  importCollectionsAction,
  previewViewQueryAction,
  getSettingsAction,
  updateSettingsAction,
  listLogsAction,
  getLogAction,
  getLogStatsAction,
  deleteLogsAction,
  listBackupsAction,
  createBackupAction,
  uploadBackupAction,
  downloadBackupAction,
  restoreBackupAction,
  deleteBackupAction,
  listCronsAction,
  runCronAction,
  runSqlAction,
];
