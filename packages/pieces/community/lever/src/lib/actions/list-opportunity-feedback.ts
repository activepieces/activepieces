import { createAction, Property } from '@activepieces/pieces-framework';
import { LEVER_BASE_URL, LeverAuth, leverAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const listOpportunityFeedback = createAction({
  name: 'listOpportunityFeedback',
  displayName: 'List opportunity feedback',
  description:
    'Get all feedback for a given opportunity, optionally for a given template',
  auth: leverAuth,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      required: true,
    }),
    template: Property.Dropdown({
      auth: leverAuth,
      displayName: 'Feedback template',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${LEVER_BASE_URL}/feedback_templates?include=text`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: auth.props.apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.map(
            (template: { text: string; id: string }) => {
              return { label: template.text, value: template.id };
            }
          ),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEVER_BASE_URL}/opportunities/${propsValue.opportunityId}/feedback`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.props.apiKey,
        password: '',
      },
    });
    const feedback = response.body.data;
    if (propsValue.template) {
      return feedback.filter(
        (form: { baseTemplateId: string }) =>
          form.baseTemplateId === propsValue.template
      );
    }
    return feedback;
  },
});
