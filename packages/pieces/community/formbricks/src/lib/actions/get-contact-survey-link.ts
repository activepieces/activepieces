import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const getContactSurveyLinkAction = createAction({
  auth: formBricksAuth,
  name: 'get_contact_survey_link',
  classification: 'READ',
  displayName: 'Get Personal Survey Link',
  description: 'Generates a survey link tied to one contact, so the response is linked to them.',
  audience: 'human',
  aiMetadata: {
    description: 'Generate a personal link to a survey picked from a dropdown for one contact ID. Creates no record; safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: false, description: 'Narrows the survey list. Optional.' }),
    surveyId: formbricksProps.survey({ required: true, description: 'A link survey.' }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'Use Find Contact to get the ID from an email.', required: true }),
    expirationDays: Property.Number({ displayName: 'Expires After (days)', description: '1 to 365. Leave empty for a link that never expires.', required: false }),
  },
  outputSchema: formbricksSchemas.contactSurveyLink,
  async run({ auth, propsValue }) {
    return formbricksApi.getContactSurveyLink({
      auth,
      surveyId: formbricksInputs.requiredString({ value: propsValue.surveyId, label: 'Survey' }),
      contactId: formbricksInputs.requiredString({ value: propsValue.contactId, label: 'Contact ID' }),
      expirationDays: propsValue.expirationDays ?? undefined,
    });
  },
});
