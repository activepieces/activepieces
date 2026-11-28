const base = {
  event_id: '6f1c2b9e-4a7d-4c3e-9b21-8d5f0a1e7c34',
  document_id: 'c3e8a1f2-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
  title: 'Consulting Agreement',
  external_id: 'deal-1042',
  template_id: 'a2d94c10-6e7b-4f38-8c15-1f3e9b7d6c02',
  source: 'api',
  created_at: '2026-11-20T15:02:11.000Z',
  sent_at: '2026-11-20T15:02:12.000Z',
  voided_at: null,
};

const clientRecipient = {
  id: 'd4f9b2a3-6c7e-4f80-9b1c-2d3e4f5a6b7c',
  role: 'signer',
  name: 'Jordan Lee',
  email: 'jordan@example.com',
};

const consultantRecipient = {
  id: 'e5a0c3b4-7d8f-4091-8c2d-3e4f5a6b7c8d',
  role: 'signer',
  name: 'Sam Rivera',
  email: 'sam@example.com',
};

const sent = {
  ...base,
  event_type: 'document.sent',
  status: 'sent',
  completed_at: null,
  recipients: [
    { ...clientRecipient, status: 'pending', viewed_at: null, signed_at: null, declined_at: null, decline_reason: null },
    { ...consultantRecipient, status: 'pending', viewed_at: null, signed_at: null, declined_at: null, decline_reason: null },
  ],
};

const signed = {
  ...base,
  event_type: 'recipient.signed',
  status: 'sent',
  completed_at: null,
  recipients: [
    {
      ...clientRecipient,
      status: 'signed',
      viewed_at: '2026-11-20T16:10:03.000Z',
      signed_at: '2026-11-20T16:12:45.000Z',
      declined_at: null,
      decline_reason: null,
    },
    { ...consultantRecipient, status: 'pending', viewed_at: null, signed_at: null, declined_at: null, decline_reason: null },
  ],
  signer_id: clientRecipient.id,
  signer_name: clientRecipient.name,
  signer_email: clientRecipient.email,
  signer_signed_at: '2026-11-20T16:12:45.000Z',
};

const completed = {
  ...base,
  event_type: 'document.completed',
  status: 'completed',
  completed_at: '2026-11-21T09:30:18.000Z',
  recipients: [
    {
      ...clientRecipient,
      status: 'signed',
      viewed_at: '2026-11-20T16:10:03.000Z',
      signed_at: '2026-11-20T16:12:45.000Z',
      declined_at: null,
      decline_reason: null,
    },
    {
      ...consultantRecipient,
      status: 'signed',
      viewed_at: '2026-11-21T09:28:40.000Z',
      signed_at: '2026-11-21T09:30:18.000Z',
      declined_at: null,
      decline_reason: null,
    },
  ],
  field_values: {
    'Client Name': 'Jordan Lee',
    'Start Date': '2026-12-01',
    'Hourly Rate': '150',
  },
  signed_pdf: 'https://cloud.activepieces.com/api/v1/step-files/signed-pdf',
  signed_pdf_file_name: 'Consulting Agreement (signed).pdf',
};

export const inklySampleData = {
  sent,
  signed,
  completed,
};
