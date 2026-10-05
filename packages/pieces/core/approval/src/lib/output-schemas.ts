import { OutputSchema } from '@activepieces/pieces-framework';

export const createApprovalLinkActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'approvalLink', label: 'Approval Link', format: 'url' },
    { key: 'disapprovalLink', label: 'Disapproval Link', format: 'url' },
  ],
};

export const waitForApprovalActionOutputSchema: OutputSchema = {
  fields: [{ key: 'approved', label: 'Approved', format: 'boolean' }],
};
