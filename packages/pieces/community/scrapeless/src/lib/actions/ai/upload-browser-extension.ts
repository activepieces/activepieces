import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const uploadBrowserExtensionAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_upload_browser_extension',
  displayName: 'Upload Browser Extension',
  description: 'Uploads a Chrome extension for use in browser sessions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a Chrome extension (.zip) and returns its extensionId to pass to Create Browser Session.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A name for the extension.',
      required: true,
    }),
    file: Property.File({
      displayName: 'Extension File',
      description: 'The Chrome extension packaged as a .zip file.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.uploadBrowserExtension({
      auth,
      name: propsValue.name,
      file: propsValue.file,
    });
  },
});
