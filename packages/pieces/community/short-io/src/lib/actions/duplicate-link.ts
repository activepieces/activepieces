import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const duplicateLinkAction = createAction({
  auth: shortIoAuth,
  name: 'duplicate_link',
  displayName: 'Duplicate Short Link',
  description: 'Create a copy of a short link with the same destination and settings.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new short link on the same domain that copies an existing link (destination URL, title, tags, UTM and redirect settings), optionally with a custom slug. Use to make a variant of a link, e.g. one per campaign channel, without re-entering its settings. Returns the new link and duplicatedFrom. Without a slug every call creates another copy; a repeat call with the same slug returns the existing copy.',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.duplicatedLink,
  props: {
    linkId: shortIoAiProps.linkId(),
    path: Property.ShortText({
      displayName: 'New Path (Slug)',
      description: 'Slug for the copy, e.g. spring-sale-email. Empty = Short.io generates one.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const path = propsValue.path?.trim().replace(/^\/+/, '');
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.POST,
        path: `/links/duplicate/${shortIoClient.seg({ value: propsValue.linkId, label: 'Link ID' })}`,
        body: path ? { path } : {},
      });
      return shortIoLinks.scrubLink(response);
    } catch (error) {
      return shortIoClient.rethrowWithHint({
        error,
        hints: {
          404: 'Short link not found. Check the link ID.',
          409: 'Another link on this domain already uses this path.',
        },
      });
    }
  },
});
