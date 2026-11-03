import { OutputSchema } from '@activepieces/pieces-framework';

export const verifyEmailOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'email',
      label: 'Email',
      format: 'email',
      description: 'The email address that was verified.',
    },
    {
      key: 'verdict',
      label: 'Verdict',
      description:
        'Deliverability verdict: deliverable, undeliverable, or unknown.',
    },
    {
      key: 'reason',
      label: 'Reason',
      description: 'Reason code or explanation for the deliverability verdict.',
    },
    {
      key: 'billing_status',
      label: 'Billing Status',
      description: 'Credit billing outcome for this check (e.g. charged).',
    },
  ],
};

export const validatePhoneOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'verdict',
      label: 'Verdict',
      description: 'Phone validation verdict: valid, invalid, or unknown.',
    },
    {
      key: 'reason',
      label: 'Reason',
      description: 'Reason code or explanation for the phone validation result.',
    },
    {
      key: 'billing_status',
      label: 'Billing Status',
      description: 'Credit billing outcome for this lookup.',
    },
    {
      key: 'details',
      label: 'Details',
      description:
        'Carrier, line type, country, and formatting metadata returned by ProWebLook.',
    },
  ],
};

export const checkWhatsappOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'verdict',
      label: 'Verdict',
      description:
        'WhatsApp registration verdict: on_whatsapp or not_on_whatsapp.',
    },
    {
      key: 'reason',
      label: 'Reason',
      description: 'Reason code or explanation for the WhatsApp check result.',
    },
    {
      key: 'billing_status',
      label: 'Billing Status',
      description: 'Credit billing outcome for this lookup.',
    },
    {
      key: 'details',
      label: 'Details',
      description:
        'Additional WhatsApp registration metadata returned by ProWebLook.',
    },
  ],
};

export const getBalanceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'account_email',
      label: 'Account Email',
      format: 'email',
      description: 'Email address of the authenticated ProWebLook account.',
    },
    {
      key: 'email',
      label: 'Email Credits',
      description: 'Available email verification credit pool.',
      children: [
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'unlimited', label: 'Unlimited', format: 'boolean' },
      ],
    },
    {
      key: 'phone',
      label: 'Phone Credits',
      description: 'Available phone validation credit pool.',
      children: [
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'unlimited', label: 'Unlimited', format: 'boolean' },
      ],
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Credits',
      description: 'Available WhatsApp verification credit pool.',
      children: [
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'unlimited', label: 'Unlimited', format: 'boolean' },
      ],
    },
  ],
};
