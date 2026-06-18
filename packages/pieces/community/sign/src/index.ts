import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { signAuth } from './lib/common/auth';
import { sendForSignature } from './lib/actions/send-for-signature';
import { detectFields } from './lib/actions/detect-fields';
import { downloadSignedDocument } from './lib/actions/download-signed-document';
import { cancelDocument } from './lib/actions/cancel-document';
import { sendOtp } from './lib/actions/send-otp';
import { verifyOtp } from './lib/actions/verify-otp';
import { getDocumentStatus } from './lib/actions/get-document-status';
import { getAuditCertificate } from './lib/actions/get-audit-certificate';
import { validateSignature } from './lib/actions/validate-signature';

export const sign = createPiece({
  displayName: 'Sign',
  description:
    'Signature électronique de documents PDF (eIDAS / PAdES) : envoi, vérification SMS (OTP), suivi du statut, certificat de preuve juridique.',
  auth: signAuth,
  minimumSupportedRelease: '0.36.0',
  logoUrl: 'https://dev.layerone.fr/logo.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.SALES_AND_CRM],
  authors: ['goprotect'],
  actions: [
    sendForSignature,
    detectFields,
    downloadSignedDocument,
    cancelDocument,
    sendOtp,
    verifyOtp,
    getDocumentStatus,
    getAuditCertificate,
    validateSignature,
  ],
  triggers: [],
});
