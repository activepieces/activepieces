import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { simplyprintAuth } from './lib/auth';

// Printer control
import { listPrintersAction } from './lib/actions/list-printers';
import { getFarmOverviewAction } from './lib/actions/get-farm-overview';
import { getPrinterAction } from './lib/actions/get-printer';
import { pausePrintAction } from './lib/actions/pause-print';
import { resumePrintAction } from './lib/actions/resume-print';
import { cancelPrintAction } from './lib/actions/cancel-print';
import { cancelPendingPrintAction } from './lib/actions/cancel-pending-print';
import { clearPrinterBedAction } from './lib/actions/clear-printer-bed';
import { skipPrintObjectsAction } from './lib/actions/skip-print-objects';
import { setPrinterOutOfOrderAction } from './lib/actions/set-printer-out-of-order';
import { sendGcodeAction } from './lib/actions/send-gcode';
import { startPrintAction } from './lib/actions/start-print';
import { getPrinterNotificationsAction } from './lib/actions/get-printer-notifications';
import { resolvePrinterNotificationAction } from './lib/actions/resolve-printer-notification';

// Queue
import { listQueueAction } from './lib/actions/list-queue';
import { getQueueItemAction } from './lib/actions/get-queue-item';
import { getNextQueueItemsAction } from './lib/actions/get-next-queue-items';
import { getNextQueueItemsForPrintersAction } from './lib/actions/get-next-queue-items-for-printers';
import { listQueueGroupsAction } from './lib/actions/list-queue-groups';
import { saveQueueGroupAction } from './lib/actions/save-queue-group';
import { deleteQueueGroupAction } from './lib/actions/delete-queue-group';
import { addToQueueAction } from './lib/actions/add-to-queue';
import { updateQueueItemAction } from './lib/actions/update-queue-item';
import { setQueueItemPrintersAction } from './lib/actions/set-queue-item-printers';
import { moveQueueItemAction } from './lib/actions/move-queue-item';
import { removeFromQueueAction } from './lib/actions/remove-from-queue';
import { reviveQueueItemAction } from './lib/actions/revive-queue-item';
import { emptyQueueAction } from './lib/actions/empty-queue';
import { listPendingQueueItemsAction } from './lib/actions/list-pending-queue-items';
import { approveQueueItemAction } from './lib/actions/approve-queue-item';
import { denyQueueItemAction } from './lib/actions/deny-queue-item';

// Files
import { listFilesAction } from './lib/actions/list-files';
import { uploadFileAction } from './lib/actions/upload-file';
import { uploadAndQueueAction } from './lib/actions/upload-and-queue';
import { uploadToFolderAction } from './lib/actions/upload-to-folder';
import { moveFileAction } from './lib/actions/move-file';
import { createFolderAction } from './lib/actions/create-folder';
import { deleteFilesAction } from './lib/actions/delete-files';
import { deleteFoldersAction } from './lib/actions/delete-folders';
import { updateFileAction } from './lib/actions/update-file';
import { downloadFileAction } from './lib/actions/download-file';

// Filament
import { listFilamentsAction } from './lib/actions/list-filaments';
import { getFilamentAction } from './lib/actions/get-filament';
import { createFilamentAction } from './lib/actions/create-filament';
import { adjustFilamentWeightAction } from './lib/actions/adjust-filament-weight';
import { markFilamentDriedAction } from './lib/actions/mark-filament-dried';
import { getFilamentHistoryAction } from './lib/actions/get-filament-history';
import { assignFilamentAction } from './lib/actions/assign-filament';
import { unassignFilamentAction } from './lib/actions/unassign-filament';

// Print history
import { listPrintHistoryAction } from './lib/actions/list-print-history';
import { getPrintJobAction } from './lib/actions/get-print-job';
import { archivePrintJobsAction } from './lib/actions/archive-print-jobs';
import { unarchivePrintJobsAction } from './lib/actions/unarchive-print-jobs';

// Tags
import { listTagsAction } from './lib/actions/list-tags';
import { createTagAction } from './lib/actions/create-tag';
import { assignTagAction } from './lib/actions/assign-tag';
import { detachTagAction } from './lib/actions/detach-tag';
import { deleteTagAction } from './lib/actions/delete-tag';

// Org / metadata
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { listCustomFieldsAction } from './lib/actions/list-custom-fields';
import { setCustomFieldValuesAction } from './lib/actions/set-custom-field-values';
import { getStatisticsAction } from './lib/actions/get-statistics';

// Utility
import { customApiCallAction } from './lib/actions/custom-api-call';

// Triggers — full catalog of webhook events (see lib/trigger/catalog.ts).
import { allTriggers } from './lib/trigger/catalog';

export const simplyprint = createPiece({
  displayName: 'SimplyPrint',
  description:
    '3D printer fleet management: monitor printers, manage the print queue, track filament, and automate print jobs.',
  auth: simplyprintAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.simplyprint.io/i/static/logo/svg/icon_white_background_rounded.svg',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['SimplyPrint'],
  actions: [
    listPrintersAction,
    getFarmOverviewAction,
    getPrinterAction,
    pausePrintAction,
    resumePrintAction,
    cancelPrintAction,
    cancelPendingPrintAction,
    clearPrinterBedAction,
    skipPrintObjectsAction,
    setPrinterOutOfOrderAction,
    sendGcodeAction,
    startPrintAction,
    getPrinterNotificationsAction,
    resolvePrinterNotificationAction,
    listQueueAction,
    getQueueItemAction,
    getNextQueueItemsAction,
    getNextQueueItemsForPrintersAction,
    listQueueGroupsAction,
    saveQueueGroupAction,
    deleteQueueGroupAction,
    addToQueueAction,
    updateQueueItemAction,
    setQueueItemPrintersAction,
    moveQueueItemAction,
    removeFromQueueAction,
    reviveQueueItemAction,
    emptyQueueAction,
    listPendingQueueItemsAction,
    approveQueueItemAction,
    denyQueueItemAction,
    listFilesAction,
    uploadFileAction,
    uploadAndQueueAction,
    uploadToFolderAction,
    moveFileAction,
    createFolderAction,
    deleteFilesAction,
    deleteFoldersAction,
    updateFileAction,
    downloadFileAction,
    listFilamentsAction,
    getFilamentAction,
    createFilamentAction,
    adjustFilamentWeightAction,
    markFilamentDriedAction,
    getFilamentHistoryAction,
    assignFilamentAction,
    unassignFilamentAction,
    listPrintHistoryAction,
    getPrintJobAction,
    archivePrintJobsAction,
    unarchivePrintJobsAction,
    listTagsAction,
    createTagAction,
    assignTagAction,
    detachTagAction,
    deleteTagAction,
    getCurrentUserAction,
    listCustomFieldsAction,
    setCustomFieldValuesAction,
    getStatisticsAction,
    customApiCallAction,
  ],
  triggers: allTriggers,
});
