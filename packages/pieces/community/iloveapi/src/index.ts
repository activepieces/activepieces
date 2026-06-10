import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { iloveapiAuth } from './lib/common/auth';
import { compressPdfAction } from './lib/actions/compress-pdf';
import { mergePdfAction } from './lib/actions/merge-pdf';
import { splitPdfAction } from './lib/actions/split-pdf';
import { pdfToJpgAction } from './lib/actions/pdf-to-jpg';
import { jpgToPdfAction } from './lib/actions/jpg-to-pdf';
import { officeToPdfAction } from './lib/actions/office-to-pdf';
import { htmlToPdfAction } from './lib/actions/html-to-pdf';
import { ocrPdfAction } from './lib/actions/ocr-pdf';
import { watermarkPdfAction } from './lib/actions/watermark-pdf';
import { protectPdfAction } from './lib/actions/protect-pdf';
import { unlockPdfAction } from './lib/actions/unlock-pdf';
import { pageNumbersPdfAction } from './lib/actions/page-numbers';
import { rotatePdfAction } from './lib/actions/rotate-pdf';
import { extractTextPdfAction } from './lib/actions/extract-text';
import { repairPdfAction } from './lib/actions/repair-pdf';
import { createSignatureRequestAction } from './lib/actions/create-signature-request';
import { getSignatureStatusAction } from './lib/actions/get-signature-status';
import { sendSignerReminderAction } from './lib/actions/send-signer-reminder';
import { voidSignatureAction } from './lib/actions/void-signature';
import { increaseExpirationDaysAction } from './lib/actions/increase-expiration-days';
import { downloadSignedFilesAction } from './lib/actions/download-signed-files';
import { downloadAuditTrailAction } from './lib/actions/download-audit-trail';
import { taskCompletedTrigger } from './lib/triggers/task-completed';
import { taskFailedTrigger } from './lib/triggers/task-failed';
import {
  signatureCompletedTrigger,
  signatureCreatedTrigger,
  signatureDeclinedTrigger,
  signatureExpiredTrigger,
  signatureSentTrigger,
  signatureVoidedTrigger,
  signerDeclinedTrigger,
  signerSignedTrigger,
  signerViewedTrigger,
} from './lib/triggers/signature-events';

export const iloveapi = createPiece({
  displayName: 'iLoveAPI',
  description:
    'Compress, merge, split, convert, OCR, watermark, protect and sign PDFs and images using iLovePDF / iLoveIMG / iLoveSign.',
  auth: iloveapiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/iloveapi.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  actions: [
    compressPdfAction,
    mergePdfAction,
    splitPdfAction,
    pdfToJpgAction,
    jpgToPdfAction,
    officeToPdfAction,
    htmlToPdfAction,
    ocrPdfAction,
    watermarkPdfAction,
    protectPdfAction,
    unlockPdfAction,
    pageNumbersPdfAction,
    rotatePdfAction,
    extractTextPdfAction,
    repairPdfAction,
    createSignatureRequestAction,
    getSignatureStatusAction,
    sendSignerReminderAction,
    voidSignatureAction,
    increaseExpirationDaysAction,
    downloadSignedFilesAction,
    downloadAuditTrailAction,
  ],
  triggers: [
    taskCompletedTrigger,
    taskFailedTrigger,
    signatureCreatedTrigger,
    signatureSentTrigger,
    signatureCompletedTrigger,
    signatureDeclinedTrigger,
    signatureExpiredTrigger,
    signatureVoidedTrigger,
    signerViewedTrigger,
    signerSignedTrigger,
    signerDeclinedTrigger,
  ],
});
