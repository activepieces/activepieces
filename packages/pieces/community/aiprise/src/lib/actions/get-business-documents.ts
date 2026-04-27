import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getBusinessDocumentsAction = createAction({
  auth: aipriseAuth,
  name: 'get_business_documents',
  displayName: 'Get Business Documents',
  description:
    'Lists all documents attached to a business profile — including file UUIDs, names, S3 URLs, timestamps, document sources, and associated verification sessions.',
  props: {
    business_profile_id: Property.ShortText({
      displayName: 'Business Profile ID',
      description:
        'The ID of the business profile whose documents you want to list. You can get this from the output of the **Create Business Profile** action.',
      required: true,
    }),
  },
  async run(context) {
    const { business_profile_id } = context.propsValue;
    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/verify/get_business_documents/${business_profile_id}`,
    });
  },
});
