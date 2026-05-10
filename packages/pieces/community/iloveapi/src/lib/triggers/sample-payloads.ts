export const taskCompletedSample = {
  event: 'task.completed',
  data: {
    task: {
      task: 'b3fd95c0c3b8c6f3a7e7b5b7a09a6d2a',
      tool: 'compress',
      status: 'TaskSuccess',
      process_start: '2026-05-07 10:00:00',
      timer: '1.32',
      filesize: 1048576,
      output_filesize: 524288,
      output_filenumber: 1,
      output_extensions: ['pdf'],
      server: 'api1g.ilovepdf.com',
      custom_int: null,
      custom_string: null,
    },
  },
};

export const taskFailedSample = {
  event: 'task.failed',
  data: {
    task: {
      task: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      tool: 'pdfocr',
      status: 'TaskError',
      process_start: '2026-05-07 10:00:00',
      message: 'DamagedFile: PDF could not be processed',
      server: 'api1g.ilovepdf.com',
    },
  },
};

const baseSignature = {
  signature_id: 'sig_01HV1Y8FZQ3XW3Y8RPVYT6WBNH',
  brand_name: 'Acme Corp',
  language: 'en-US',
  status: 'created',
  uuid: '5f7d2a3b-abc-1234',
  mode: 'multiple',
  subject_signer: 'Please sign this document',
  message_signer: 'Sign the attached contract',
  certified: true,
  files: [
    {
      server_filename: 'contract.pdf',
      filename: 'contract.pdf',
    },
  ],
  signers: [
    {
      uuid: 'rcv_01HV1Y8FZQ3XW3Y8RPVYT6SIGN',
      email: 'john@example.com',
      name: 'John Doe',
      type: 'signer',
      status: 'waiting',
    },
  ],
  created: '2026-05-07T10:00:00Z',
};

export const signatureCreatedSample = {
  event: 'signature.created',
  data: { signature: { ...baseSignature, status: 'created' } },
};

export const signatureSentSample = {
  event: 'signature.sent',
  data: { signature: { ...baseSignature, status: 'sent' } },
};

export const signatureCompletedSample = {
  event: 'signature.completed',
  data: { signature: { ...baseSignature, status: 'completed' } },
};

export const signatureDeclinedSample = {
  event: 'signature.declined',
  data: { signature: { ...baseSignature, status: 'declined' } },
};

export const signatureExpiredSample = {
  event: 'signature.expired',
  data: { signature: { ...baseSignature, status: 'expired' } },
};

export const signatureVoidedSample = {
  event: 'signature.voided',
  data: { signature: { ...baseSignature, status: 'voided' } },
};

const baseSigner = {
  uuid: 'rcv_01HV1Y8FZQ3XW3Y8RPVYT6SIGN',
  email: 'john@example.com',
  name: 'John Doe',
  type: 'signer',
};

export const signerViewedSample = {
  event: 'signature.signer.viewed',
  data: {
    signature: { ...baseSignature },
    signer: { ...baseSigner, status: 'viewed', viewed: '2026-05-07T10:05:00Z' },
  },
};

export const signerSignedSample = {
  event: 'signature.signer.completed',
  data: {
    signature: { ...baseSignature },
    signer: { ...baseSigner, status: 'signed', signed: '2026-05-07T10:10:00Z' },
  },
};

export const signerDeclinedSample = {
  event: 'signature.signer.declined',
  data: {
    signature: { ...baseSignature },
    signer: {
      ...baseSigner,
      status: 'declined',
      declined: '2026-05-07T10:15:00Z',
      reason: 'Not the right document',
    },
  },
};
