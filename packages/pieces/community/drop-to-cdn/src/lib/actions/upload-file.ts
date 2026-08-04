import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dropToCdnAuth } from '../auth';
import { dropToCdnApiCall } from '../client';

export const uploadFile = createAction({
  auth: dropToCdnAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to Drop to CDN and get a public CDN URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file to Drop to CDN via multipart POST and returns the public CDN URL, file ID, expiry, size, and MIME type. Use when a previous step provides a file (upload or URL). Not idempotent: each call creates a new file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (upload directly or provide a URL).',
      required: true,
    }),
    retention_days: Property.Number({
      displayName: 'Retention (days)',
      description:
        'Paid plans only. Leave empty to use your plan default (30 days on Free).',
      required: false,
    }),
    never_expire: Property.Checkbox({
      displayName: 'Never expire',
      description: 'Paid plans only. Skip automatic expiration for this file.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { file, retention_days, never_expire } = context.propsValue;
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    form.append('file', file.data, file.filename);

    if (
      typeof retention_days === 'number' &&
      Number.isFinite(retention_days) &&
      retention_days > 0
    ) {
      form.append('retention_days', String(retention_days));
    }

    if (never_expire) {
      form.append('never_expire', 'true');
    }

    return dropToCdnApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/files',
      body: form,
      headers: form.getHeaders(),
    });
  },
});
