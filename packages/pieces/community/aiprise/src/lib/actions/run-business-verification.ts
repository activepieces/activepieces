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
    business_id: Property.ShortText({
      displayName: 'Your Business Reference',
      description:
        'Your own identifier for this company — for example your CRM account ID, company registration number, or internal record ID. AiPrise stores this alongside the verification so you can match results back to your records.',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, business_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/run_business_verification',
      body: { template_id, business_id },
    });
    return result;
  },
});
