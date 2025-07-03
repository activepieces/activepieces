import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { LEVER_BASE_URL, LeverAuth, leverAuth } from '../..';

export const updateOpportunityStage = createAction({
  name: 'updateOpportunityStage',
  displayName: 'Update opportunity stage',
  description: "Change an Opportunity's current stage",
  auth: leverAuth,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      required: true,
    }),
    stage: Property.Dropdown({
      displayName: 'Stage',
      required: true,
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
          url: `${LEVER_BASE_URL}/stages`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: (auth as LeverAuth).apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.map(
            (stage: { text: string; id: string }) => {
              return { label: stage.text, value: stage.id };
            }
          ),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${LEVER_BASE_URL}/opportunities/${propsValue.opportunityId}/stage`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.apiKey,
        password: '',
      },
      body: { stage: propsValue.stage },
    });

    return response.body.data;
  },
});
