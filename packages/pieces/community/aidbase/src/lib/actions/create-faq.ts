import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';

export const createFaq = createAction({
  auth: aidbaseAuth,
  name: 'create_faq',
  displayName: 'Create FAQ',
  description: 'Creates a new FAQ entry with title and description.',

  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new FAQ knowledge base.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'An optional description for the FAQ.',
      required: false,
    }),
  },

  async run(context) {
    const { auth: apiKey, propsValue } = context;
    const { title, description } = propsValue;

    return await aidbaseClient.createFaq(apiKey, {
      title,
      description,
    });
  },
});
