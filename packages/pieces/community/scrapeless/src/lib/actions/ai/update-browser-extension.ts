import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const updateBrowserExtensionAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_update_browser_extension',
  displayName: 'Update Browser Extension',
  description: 'Replaces an uploaded extension with a new version.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces an uploaded browser extension with a new .zip and name, keeping its extensionId.',
    idempotent: true,
  },
  props: {
    extensionId: Property.ShortText({
      displayName: 'Extension ID',
      description:
        'The extensionId, from List Browser Extensions or Upload Browser Extension.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The extension name to keep or set.',
      required: true,
    }),
    file: Property.File({
      displayName: 'Extension File',
      description: 'The Chrome extension packaged as a .zip file.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.updateBrowserExtension({
      auth,
      extensionId: propsValue.extensionId,
      name: propsValue.name,
      file: propsValue.file,
    });
  },
});
