import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const deleteBrowserExtensionAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_delete_browser_extension',
  displayName: 'Delete Browser Extension',
  description: 'Permanently deletes an uploaded browser extension.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an uploaded browser extension; sessions can no longer load it. This cannot be undone.',
    idempotent: false,
  },
  props: {
    extensionId: Property.ShortText({
      displayName: 'Extension ID',
      description:
        'The extensionId, from List Browser Extensions or Upload Browser Extension.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.deleteBrowserExtension({
      auth,
      extensionId: propsValue.extensionId,
    });
  },
});
