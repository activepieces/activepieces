import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const runUserVerificationAction = createAction({
  auth: aipriseAuth,
  name: 'run_user_verification',
  displayName: 'Start Identity Verification',
  description:
    'Kicks off a new identity check for a person. AiPrise will run the checks defined in your chosen template (e.g. ID document scan, liveness, address).',
  props: {
    template_id: Property.ShortText({
      displayName: 'Verification Template',
      description:
        'Which set of checks to run. To find this: log in to AiPrise → go to **Templates** → open the template you want → copy the **Template ID** shown at the top of the page.',
      required: true,
    }),
    user_id: Property.ShortText({
      displayName: 'Your User Reference',
      description:
        'Your own identifier for this person — for example their user ID, email address, or order number. AiPrise stores this alongside the verification so you can match results back to your records.',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, user_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/verify/run_user_verification',
      body: {
        template_id,
        user_id,
      },
    });
    return result;
  },
});
