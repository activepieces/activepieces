import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../../common/ai-props';
import { shortIoAuth } from '../../common/auth';
import { shortIoClient } from '../../common/client';
import { shortIoSchemas } from '../../common/output-schemas';

export const deleteLinkAiAction = createAction({
  auth: shortIoAuth,
  name: 'delete_link',
  displayName: 'Delete Short Link (AI)',
  description: 'Permanently delete a short link by ID; a repeat call reports it as already deleted.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a short link by ID; the short URL stops working. A repeat call reports already deleted.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.deleteLink,
  props: {
    linkId: shortIoAiProps.linkId(),
  },
  async run({ auth, propsValue }) {
    const linkId = propsValue.linkId.trim();
    try {
      await shortIoClient.request({ auth, method: HttpMethod.DELETE, path: `/links/${shortIoClient.seg({ value: linkId, label: 'Link ID' })}` });
      return { linkId, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (shortIoClient.errorStatus(error) === 404) {
        return { linkId, deleted: false, alreadyDeleted: true };
      }
      return shortIoClient.rethrowWithHint({ error, hints: {} });
    }
  },
});
