import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth, aidbaseCommon } from '../../common';
import { CreateFaqProperties } from '../../common/properties';
import { CreateFaqSchema } from '../../common/schemas';

export const createFaq = createAction({
  auth: aidbaseAuth,
  name: 'createFaq',
  displayName: 'Create FAQ',
  description: 'Creates a new FAQ entry with title and description.',
  props: CreateFaqProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, CreateFaqSchema);
    return await aidbaseCommon.createFaq({ apiKey, ...propsValue });
  },
});
