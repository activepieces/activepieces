import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const getContactSurveyLinkAiAction = createAction({
  auth: formBricksAuth,
  name: 'get_contact_survey_link_ai',
  classification: 'READ',
  displayName: 'Get Personal Survey Link (AI)',
  description: 'Generates a personal survey link for a survey ID and contact ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Generate a personalized Formbricks link survey URL for one contact, so the answers are attributed to that contact. Optional expirationDays (1 to 365); otherwise the link never expires. Creates no record and does not send anything; safe to retry.',
    idempotent: true,
  },
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    expirationDays: Property.Number({ displayName: 'Expires After (days)', required: false }),
  },
  outputSchema: formbricksSchemas.contactSurveyLink,
  async run({ auth, propsValue }) {
    return formbricksApi.getContactSurveyLink({
      auth,
      surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey ID' }),
      contactId: formbricksInputs.requiredString({ value: propsValue.contactId, label: 'Contact ID' }),
      expirationDays: propsValue.expirationDays ?? undefined,
    });
  },
});
