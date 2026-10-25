import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { iLoveApi } from './lib/common/client';
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
import { compressImageAction } from './lib/actions/compress-image';
import { resizeImageAction } from './lib/actions/resize-image';
import { cropImageAction } from './lib/actions/crop-image';
import { convertImageAction } from './lib/actions/convert-image';
import { upscaleImageAction } from './lib/actions/upscale-image';
import { removeBackgroundImageAction } from './lib/actions/remove-background-image';
import { rotateImageAction } from './lib/actions/rotate-image';
import { convertPdfaAction } from './lib/actions/convert-pdf-to-pdfa';
import { validatePdfaAction } from './lib/actions/validate-pdfa';
import { createSignatureRequestAiAction } from './lib/actions/create-signature-request-ai';
import { listSignatureRequestsAction } from './lib/actions/list-signature-requests';
import { getSignerInfoAction } from './lib/actions/get-signer-info';
import { watermarkImageAction } from './lib/actions/watermark-image';
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

const CUSTOM_API_BASE = 'https://api.ilovepdf.com/v1';

export const iloveapi = createPiece({
  displayName: 'iLoveAPI',
  description:
    'Compress, merge, split, convert, OCR, watermark, protect and sign PDFs and images using iLovePDF / iLoveIMG / iLoveSign.',
  auth: iloveapiAuth,
  minimumSupportedRelease: '0.86.4',
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
    convertPdfaAction,
    validatePdfaAction,
    compressImageAction,
    resizeImageAction,
    cropImageAction,
    convertImageAction,
    upscaleImageAction,
    removeBackgroundImageAction,
    watermarkImageAction,
    rotateImageAction,
    createSignatureRequestAction,
    createSignatureRequestAiAction,
    listSignatureRequestsAction,
    getSignatureStatusAction,
    getSignerInfoAction,
    sendSignerReminderAction,
    voidSignatureAction,
    increaseExpirationDaysAction,
    downloadSignedFilesAction,
    downloadAuditTrailAction,
    createCustomApiCallAction({
      auth: iloveapiAuth,
      baseUrl: () => CUSTOM_API_BASE,
      authMapping: async (auth, propsValue) => {
        assertCustomApiUrl(propsValue['url']);
        const token = await iLoveApi.authenticate({ publicKey: auth.secret_text });
        return { Authorization: `Bearer ${token}` };
      },
    }),
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

function assertCustomApiUrl(urlProp: unknown): void {
  const raw = urlProp !== null && typeof urlProp === 'object' ? Reflect.get(urlProp, 'url') : undefined;
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value === '') {
    throw new Error('URL is required.');
  }
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//');
  const target = isAbsolute ? value : `${CUSTOM_API_BASE}/${value.replace(/^\/+/, '')}`;
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error('URL is not valid.');
  }
  const base = new URL(CUSTOM_API_BASE);
  const segments = parsed.pathname.split('/');
  if (
    parsed.origin !== base.origin ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    !parsed.pathname.startsWith(`${base.pathname}/`) ||
    segments.includes('..') ||
    segments.includes('.') ||
    /%2e|%2f|%5c|\\/i.test(value)
  ) {
    throw new Error(`Custom API Call only sends your iLoveAPI credentials to ${CUSTOM_API_BASE}/...`);
  }
}

