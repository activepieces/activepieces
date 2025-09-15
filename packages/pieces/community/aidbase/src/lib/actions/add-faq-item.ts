import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth, aidbaseCommon } from '../../common';
import { AddFaqItemProperties } from '../../common/properties';
import { AddFaqItemSchema } from '../../common/schemas';

export const addFaqItem = createAction({
  auth: aidbaseAuth,
  name: 'addFaqItem',
  displayName: 'Add FAQ Item',
  description:
    'Adds a new question/answer item to an existing FAQ; supports categories',
  props: AddFaqItemProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, AddFaqItemSchema);
    const { categories, ...rest } = propsValue;
    return await aidbaseCommon.addFaqItem({
      apiKey,
      categories: categories ? (categories as string[]) : undefined,
      ...rest,
    });
  },
});
