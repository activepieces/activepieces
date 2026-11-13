import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoArchive } from '../common/archive';
import { shortIoAuth } from '../common/auth';
import { shortIoSchemas } from '../common/output-schemas';

export const unarchiveLinkAction = createAction({
  auth: shortIoAuth,
  name: 'unarchive_link',
  displayName: 'Unarchive Short Link',
  description: 'Restore an archived short link to the active list.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Restores an archived short link (by link ID) to the active link list. Idempotent: unarchiving an active link changes nothing.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.archive,
  props: {
    linkId: shortIoAiProps.linkId(),
  },
  async run({ auth, propsValue }) {
    return shortIoArchive.setArchived({ auth, linkId: propsValue.linkId, archived: false });
  },
});
