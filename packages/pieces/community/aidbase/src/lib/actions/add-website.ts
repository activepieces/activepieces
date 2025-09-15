import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth, aidbaseCommon } from '../../common';
import { AddWebsiteProperties } from '../../common/properties';
import { AddWebsiteSchema } from '../../common/schemas';

export const addWebsite = createAction({
  auth: aidbaseAuth,
  name: 'addWebsite',
  displayName: 'Add Website',
  description: 'Adds a website URL as a knowledge source for Aidbase.',
  props: AddWebsiteProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, AddWebsiteSchema);
    return await aidbaseCommon.addWebsite({ apiKey, ...propsValue });
  },
});
