import { createAction, Property } from '@activepieces/pieces-framework';
import { provenExpertCommon } from '../common';
import { provenExpertAuth } from '../common/auth';

export const createSurveyInvitationUrlAction = createAction({
  auth: provenExpertAuth,
  name: 'create_survey_invitation_url',
  displayName: 'Create Survey Invitation URL',
  description: 'Generates a personalised, one-time-use survey link that you can send to a customer.',
  props: {
    survey_code: provenExpertCommon.surveyDropdown,
    email: Property.ShortText({
      displayName: 'Recipient Email',
      description: 'Email address of the customer who will receive the survey link. The link is tied to this address.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Recipient Name',
      description: 'Optional full name of the recipient. Used to personalise the survey experience.',
      required: false,
    }),
  },
  async run(context) {
    const { survey_code, email, name } = context.propsValue;
    const response = await provenExpertCommon.apiCall<{
      status: string;
      url?: string;
      exists?: number;
    }>({
      auth: context.auth.props,
      path: '/invite/url/create',
      body: {
        code: survey_code,
        email,
        ...(name ? { name } : {}),
      },
    });
    return {
      status: response.body.status,
      invitation_url: response.body.url ?? null,
      already_existed: response.body.exists === 1,
      survey_code,
      recipient_email: email,
      recipient_name: name ?? null,
    };
  },
});
