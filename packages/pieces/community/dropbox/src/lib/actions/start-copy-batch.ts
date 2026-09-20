import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { relocationLaunchOutputSchema } from '../output-schemas';

export const dropboxStartCopyBatch = createAction({
  auth: dropboxAuth,
  name: 'start_dropbox_copy_batch',
  classification: 'WRITE',
  displayName: 'Start Copy Batch',
  description: 'Copy many files or folders in one job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a job copying up to 1000 Dropbox files or folders in one call, leaving the originals in place. Small batches complete immediately; larger ones return an async job id that Get Copy Batch Status polls. Not idempotent: each call copies again, so repeating it duplicates entries.',
    idempotent: false,
  },
  outputSchema: relocationLaunchOutputSchema,
  props: {
    entries: Property.Array({
      displayName: 'Entries',
      description:
        'Each entry needs a From Path and a To Path. Both accept a path (/folder/file.txt) or an id (id:abc123). At most 1000 entries.',
      required: true,
      properties: {
        from_path: Property.ShortText({
          displayName: 'From Path',
          required: true,
        }),
        to_path: Property.ShortText({
          displayName: 'To Path',
          required: true,
        }),
      },
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'Let Dropbox rename an entry when its destination conflicts.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const entries = context.propsValue.entries as {
      from_path: string;
      to_path: string;
    }[];
    if (entries.length === 0) {
      throw new Error('Provide at least one entry to copy.');
    }
    if (entries.length > 1000) {
      throw new Error('Dropbox accepts at most 1000 entries per copy batch.');
    }
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/copy_batch_v2',
      body: {
        entries: entries.map((entry) => ({
          from_path: entry.from_path,
          to_path: entry.to_path,
        })),
        autorename: context.propsValue.autorename ?? false,
      },
    });
  },
});
