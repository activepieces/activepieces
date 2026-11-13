import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoArchive } from '../common/archive';
import { shortIoAuth } from '../common/auth';
import { shortIoSchemas } from '../common/output-schemas';

export const archiveLinkAction = createAction({
  auth: shortIoAuth,
  name: 'archive_link',
  displayName: 'Archive Short Link',
  description: 'Archive a short link (hide it from the dashboard; the short URL keeps redirecting).',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Archives a short link by link ID, hiding it from the default dashboard list; the short URL keeps working. Reversible with Unarchive Short Link. Idempotent: archiving an archived link changes nothing.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.archive,
  props: {
    linkId: shortIoAiProps.linkId(),
  },
  async run({ auth, propsValue }) {
    return shortIoArchive.setArchived({ auth, linkId: propsValue.linkId, archived: true });
  },
});
