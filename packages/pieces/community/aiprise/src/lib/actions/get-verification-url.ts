import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getVerificationUrlAction = createAction({
  auth: aipriseAuth,
  name: 'get_verification_url',
  displayName: 'Get Identity Verification Link',
  description:
    'Generates a secure link you can send to a person so they can complete their identity verification on an AiPrise-hosted page — no extra development needed.',
  props: {
    template_id: Property.ShortText({
      displayName: 'Verification Template',
      description:
        'Which set of checks the person will go through. To find this: log in to AiPrise → go to **Templates** → open the template you want → copy the **Template ID** shown at the top of the page.',
      required: true,
    }),
    redirect_uri: Property.ShortText({
      displayName: 'Redirect URL',
      description:
        'The page the person will be sent to after they finish the verification on the AiPrise-hosted form (e.g. a "Thank you" or confirmation page on your website).',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, redirect_uri } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/verify/get_user_verification_url',
      body: {
        template_id,
        redirect_uri,
      },
    });
    return result;
  },
});
