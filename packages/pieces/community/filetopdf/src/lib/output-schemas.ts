import { OutputSchema } from '@activepieces/pieces-framework';

export const conversionOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'PDF File', format: 'url' },
    { key: 'filename', label: 'File Name' },
    { key: 'pages', label: 'Page Count', format: 'number' },
    { key: 'fileSize', label: 'File Size', format: 'filesize' },
    { key: 'creditsUsed', label: 'Credits Used', format: 'number' },
    { key: 'creditsRemaining', label: 'Credits Remaining', format: 'number' },
  ],
};

export const getAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'workspaceId', label: 'Workspace ID' },
    { key: 'plan', label: 'Plan' },
    { key: 'creditsRemaining', label: 'Credits Remaining', format: 'number' },
    { key: 'subscriptionStatus', label: 'Subscription Status' },
  ],
};
