import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getBrowserExtensionAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_browser_extension',
  displayName: 'Get Browser Extension',
  description: 'Gets an uploaded browser extension by id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one uploaded browser extension: its name, manifest name and version.',
    idempotent: true,
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
    return await scrapelessApi.getBrowserExtension({
      auth,
      extensionId: propsValue.extensionId,
    });
  },
});
