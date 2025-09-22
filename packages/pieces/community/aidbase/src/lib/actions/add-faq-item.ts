import { createAction, Property } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { aidbaseClient } from '../common/client';
import { faqDropdown } from '../common/props';

export const addFaqItem = createAction({
  auth: aidbaseAuth,
  name: 'add_faq_item',
  displayName: 'Add FAQ Item',
  description:
    'Adds a new question/answer item to an existing FAQ; supports categories.',

  props: {
    faq_id: faqDropdown, 
    question: Property.ShortText({
      displayName: 'Question',
      required: true,
    }),
    answer: Property.LongText({
      displayName: 'Answer',
      required: true,
    }),
    source_url: Property.ShortText({
      displayName: 'Source URL',
      description: 'An optional URL for the source of the information.',
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description:
        'A list of category names. New categories will be created if they do not exist.',
      required: false,
    }),
  },

  async run(context) {
    const { auth: apiKey, propsValue } = context;
    const { faq_id, question, answer, source_url, categories } = propsValue;

    return await aidbaseClient.addFaqItem(apiKey, faq_id, {
      question,
      answer,
      source_url,
      categories: categories as string[] | undefined,
    });
  },
});
