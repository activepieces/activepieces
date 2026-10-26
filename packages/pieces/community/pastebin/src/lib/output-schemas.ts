import { OutputSchema } from '@activepieces/pieces-framework';

export const pastebinGetAccountDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'user_name', label: 'Username' },
    { key: 'user_email', label: 'Email', format: 'email' },
    { key: 'user_account_type', label: 'Account Type (0 Free, 1 PRO)' },
    { key: 'user_format_short', label: 'Default Format' },
    { key: 'user_expiration', label: 'Default Expiry' },
    {
      key: 'user_private',
      label: 'Default Privacy (0 Public, 1 Unlisted, 2 Private)',
    },
    { key: 'user_avatar_url', label: 'Avatar URL', format: 'url' },
    { key: 'user_website', label: 'Website' },
    { key: 'user_location', label: 'Location' },
  ],
};

export const createPasteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Paste Key' },
    { key: 'url', label: 'Paste URL', format: 'url' },
  ],
};

export const pastebinDeletePasteOutputSchema: OutputSchema = {
  fields: [
    { key: 'paste_key', label: 'Paste Key' },
    { key: 'message', label: 'Message' },
  ],
};

export const getPasteContentOutputSchema: OutputSchema = {
  fields: [{ key: 'content', label: 'Content' }],
};

export const pastebinListPastesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'pastes',
      label: 'Pastes',
      labelKey: 'paste_title',
      listItems: [
        { key: 'paste_key', label: 'Paste Key' },
        { key: 'paste_title', label: 'Title' },
        { key: 'paste_url', label: 'URL', format: 'url' },
        { key: 'paste_date', label: 'Created At (Unix Seconds)' },
        {
          key: 'paste_expire_date',
          label: 'Expires At (Unix Seconds, 0 Never)',
        },
        {
          key: 'paste_private',
          label: 'Privacy (0 Public, 1 Unlisted, 2 Private)',
        },
        { key: 'paste_format_short', label: 'Format' },
        { key: 'paste_format_long', label: 'Format Name' },
        { key: 'paste_size', label: 'Size (Bytes)' },
        { key: 'paste_hits', label: 'Hits' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};
