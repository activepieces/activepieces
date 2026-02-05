import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { FaqUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//  Endpoint: PATCH /public-api/resources/faqs/v2.0/{faq}

export const faqUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'faqUpdate',
  displayName: 'Resources - Faqs - Update',
  description: 'Update FAQs.',
  props: {
        
  faq: Property.Number({
    displayName: 'Faq',
    description: '',
    required: true,
  }),

  question: Property.Array({
    displayName: 'Question',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),

  answer: Property.Array({
    displayName: 'Answer',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),
  },
  async run(context): Promise<FaqUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/faqs/v2.0/{faq}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['question', 'answer']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as FaqUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
