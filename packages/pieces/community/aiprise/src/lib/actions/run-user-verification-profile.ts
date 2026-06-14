import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const runUserVerificationProfileAction = createAction({
  auth: aipriseAuth,
  name: 'run_user_verification_profile',
  displayName: 'Start Identity Verification for profile',
  description:
    'Kicks off a new identity check for a person. AiPrise will run the checks defined in your chosen template (e.g. ID document scan, liveness, address).',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a server-side identity (KYC) verification for an existing user profile by running the checks bundled in a given AiPrise template (ID scan, liveness, address, etc.). Use when you want to programmatically begin verifying a person you have already created a profile for, rather than sending them a hosted link. Requires a template ID and your user_profile_id. Not idempotent — each call launches a new verification session.',
    idempotent: false,
  },
  props: {
    template_id: Property.ShortText({
      displayName: 'Verification Template',
      description:
        'Which set of checks to run. To find this: log in to AiPrise → go to **Templates** → open the template you want → copy the **Template ID** shown at the top of the page.',
      required: true,
    }),
    user_profile_id: Property.ShortText({
      displayName: 'User Profile ID',
      description:
        'Your own identifier for this person — for example their user ID, email address, or order number. AiPrise stores this alongside the verification so you can match results back to your records.',
      required: true,
    }),
    
  },
  async run(context) {
    const {
      template_id,
      user_profile_id,
     
    } = context.propsValue;

    const body: Record<string, unknown> = { template_id,user_profile_id };
   
    return aiprise.makeRequest<Record<string, unknown>>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/verify/run_verification_for_user_profile_id',
      body,
    });
  },
});
