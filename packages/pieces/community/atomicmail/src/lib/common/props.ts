import { Property } from '@activepieces/pieces-framework';

export const accountIdProp = Property.ShortText({
  displayName: 'Account namespace',
  description:
    'Optional. Leave as `default` to match **Register Inbox**, or set a unique name for multiple inboxes in this project.',
  required: false,
  defaultValue: 'default',
});

export const optionalApiKeyProp = Property.ShortText({
  displayName: 'API Key (optional)',
  description:
    'Paste an existing key or `{{register.apiKey}}` from Register. Leave empty to use credentials saved by Register.',
  required: false,
});

export const projectStoreHintProp = Property.MarkDown({
  value:
    'Run **Register Inbox** first. Leave Account namespace as `default`, or paste an API key below.',
});
