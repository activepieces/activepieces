import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const runBusinessVerificationAction = createAction({
  auth: aipriseAuth,
  name: 'run_business_verification',
  displayName: 'Start Business Verification',
  description:
    'Kicks off a company background check. AiPrise will run the checks defined in your template — which can include company registry lookup, ownership structure (UBO), sanctions screening, and adverse media.',
  props: {
    template_id: Property.ShortText({
      displayName: 'Verification Template',
      description:
        'Which set of checks to run on the business. To find this: log in to AiPrise → go to **Templates** → open the template you want → copy the **Template ID** shown at the top of the page.',
      required: true,
    }),
    business_profile_id: Property.ShortText({
      displayName: 'Business Profile ID',
      description: ' The ID of the business profile you want to verify. This is returned when you create a business profile, or you can look it up using the List Business Profiles action.',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, business_profile_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/verify/run_verification_for_business_profile_id',
      body: { template_id, business_profile_id },
    });
    return result;
  },
});
