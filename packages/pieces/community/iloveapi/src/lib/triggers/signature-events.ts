import { buildSignatureTrigger } from './signature-builder';
import {
  signatureCompletedSample,
  signatureCreatedSample,
  signatureDeclinedSample,
  signatureExpiredSample,
  signatureSentSample,
  signatureVoidedSample,
  signerDeclinedSample,
  signerSignedSample,
  signerViewedSample,
} from './sample-payloads';

export const signatureCreatedTrigger = buildSignatureTrigger({
  name: 'signature_created',
  displayName: 'Signature Created',
  description: 'Fires when a new signature request is created.',
  event: 'signature.created',
  sampleData: signatureCreatedSample,
});

export const signatureSentTrigger = buildSignatureTrigger({
  name: 'signature_sent',
  displayName: 'Signature Sent',
  description: 'Fires when a signature request is sent to all receivers.',
  event: 'signature.sent',
  sampleData: signatureSentSample,
});

export const signatureCompletedTrigger = buildSignatureTrigger({
  name: 'signature_completed',
  displayName: 'Signature Completed',
  description:
    'Fires when every signer has finished. Use this to drive contract-completion automations.',
  event: 'signature.completed',
  sampleData: signatureCompletedSample,
});

export const signatureDeclinedTrigger = buildSignatureTrigger({
  name: 'signature_declined',
  displayName: 'Signature Declined',
  description:
    'Fires when a signer or validator declines the signature request.',
  event: 'signature.declined',
  sampleData: signatureDeclinedSample,
});

export const signatureExpiredTrigger = buildSignatureTrigger({
  name: 'signature_expired',
  displayName: 'Signature Expired',
  description: 'Fires when a signature request reaches its expiration date.',
  event: 'signature.expired',
  sampleData: signatureExpiredSample,
});

export const signatureVoidedTrigger = buildSignatureTrigger({
  name: 'signature_voided',
  displayName: 'Signature Voided',
  description: 'Fires when the requester cancels an in-progress signature.',
  event: 'signature.voided',
  sampleData: signatureVoidedSample,
});

export const signerViewedTrigger = buildSignatureTrigger({
  name: 'signer_viewed',
  displayName: 'Signer Viewed Document',
  description: 'Fires when an individual receiver opens the document.',
  event: 'signature.signer.viewed',
  sampleData: signerViewedSample,
});

export const signerSignedTrigger = buildSignatureTrigger({
  name: 'signer_signed',
  displayName: 'Signer Signed',
  description: 'Fires when an individual signer completes their signature.',
  event: 'signature.signer.completed',
  sampleData: signerSignedSample,
});

export const signerDeclinedTrigger = buildSignatureTrigger({
  name: 'signer_declined',
  displayName: 'Signer Declined',
  description: 'Fires when an individual signer declines to sign.',
  event: 'signature.signer.declined',
  sampleData: signerDeclinedSample,
});
