import { createAction } from '@activepieces/pieces-framework';
import { imapAuth, performImapOperation, folderProp, ImapError } from '../common';
import { getQuotaOutputSchema } from '../output-schemas';

function readResource({
  source,
  resource,
}: {
  source: unknown;
  resource: string;
}): { used: number | null; limit: number | null } | null {
  if (typeof source !== 'object' || source === null || !(resource in source)) {
    return null;
  }
  const entry: unknown = Reflect.get(source, resource);
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }
  const used: unknown = Reflect.get(entry, 'usage') ?? Reflect.get(entry, 'used');
  const limit: unknown = Reflect.get(entry, 'limit');
  return {
    used: typeof used === 'number' ? used : null,
    limit: typeof limit === 'number' ? limit : null,
  };
}

export const getQuota = createAction({
  auth: imapAuth,
  name: 'get_quota',
  classification: 'READ',
  displayName: 'Get Quota',
  description: 'Gets the storage and message quota for a folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the storage (in bytes) and message-count usage and limits of the quota root that applies to a folder, via the IMAP QUOTA extension. Use to check whether the mailbox is near full. has_quota=false means the server reports no quota for that folder. Fails with a clear message when the server lacks QUOTA. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    folder: folderProp({
      displayName: 'Folder',
      description: 'Folder path from list_folders.',
    }),
  },
  outputSchema: getQuotaOutputSchema,
  async run({ auth, propsValue }) {
    const folder = propsValue.folder.trim();
    return performImapOperation(auth, async (client) => {
      if (!client.capabilities.has('QUOTA')) {
        throw new ImapError('The server does not support the QUOTA extension.');
      }
      const result = await client.getQuota(folder);
      if (!result) {
        throw new ImapError(`The server returned no quota information for "${folder}".`);
      }
      const storage = readResource({ source: result, resource: 'storage' });
      const messages =
        readResource({ source: result, resource: 'message' }) ??
        readResource({ source: result, resource: 'messages' });
      return {
        path: result.path,
        has_quota: storage !== null || messages !== null,
        storage_used_bytes: storage?.used ?? null,
        storage_limit_bytes: storage?.limit ?? null,
        messages_used: messages?.used ?? null,
        messages_limit: messages?.limit ?? null,
      };
    });
  },
});
