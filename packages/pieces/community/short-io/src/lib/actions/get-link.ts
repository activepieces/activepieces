import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoLinkQueries } from '../common/link-queries';
import { shortIoSchemas } from '../common/output-schemas';

export const getLinkAction = createAction({
  auth: shortIoAuth,
  name: 'get_link',
  displayName: 'Get Link by ID',
  description: 'Get a short link and its settings by link ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one short link (short URL, original URL, path, title, tags, expiry, folder) by its link ID. Returns found=false when no link has that ID. The link password is never returned. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.linkLookup,
  props: {
    linkId: shortIoAiProps.linkId(),
  },
  async run({ auth, propsValue }) {
    const link = await shortIoLinkQueries.getById({ auth, linkId: propsValue.linkId });
    return { found: link !== null, link };
  },
});
