import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { FaqCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/faqs/v2.0

export const faqCreateAction = createAction({
  auth: ampecoAuth,
  name: 'faqCreate',
  displayName: 'Resources - Faqs - Create',
  description: 'Create new FAQ.',
  props: {
        
  question: Property.Array({
    displayName: 'Question',
    description: '',
    required: true,
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
    required: true,
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
  async run(context): Promise<FaqCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/faqs/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['question', 'answer']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as FaqCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
