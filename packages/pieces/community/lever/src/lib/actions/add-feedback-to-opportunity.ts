import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { LEVER_BASE_URL, LeverAuth, leverAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { LeverFieldMapping } from '../common';

export const addFeedbackToOpportunity = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'addFeedbackToOpportunity',
  displayName: 'Add feedback to opportunity',
  description: 'Provide feedback to a candidate after an interview',
  auth: leverAuth,
  props: {
    performAs: Property.Dropdown({
      displayName: 'Feedback author',
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

        const users = [];
        let cursor = undefined;
        do {
          const queryParams: Record<string, string> = {
            include: 'name',
          };
          if (cursor) {
            queryParams['offset'] = cursor;
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${LEVER_BASE_URL}/users`,
            queryParams: queryParams,
            authentication: {
              type: AuthenticationType.BASIC,
              username: (auth as LeverAuth).apiKey,
              password: '',
            },
          });
          cursor = response.body.next;
          const usersPage = response.body.data.map(
            (user: { id: string; name: string }) => {
              return {
                label: user.name,
                value: user.id,
              };
            }
          );
          users.push(...usersPage);
        } while (cursor !== undefined);

        return {
          options: users,
        };
      },
    }),
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      required: true,
    }),
    panelId: Property.Dropdown({
      displayName: 'Interview panel',
      required: false,
      refreshers: ['auth', 'opportunityId'],
      options: async ({ auth, opportunityId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }
        if (!opportunityId) {
          return {
            disabled: true,
            placeholder: 'Please select a candidate (opportunity).',
            options: [],
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${LEVER_BASE_URL}/opportunities/${opportunityId}/panels?expand=stage&include=id&include=stage&include=start`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: (auth as LeverAuth).apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.map(
            (panel: { id: string; start: number; stage: { text: string } }) => {
              const interviewDate = new Date(panel.start);
              return {
                label: `${interviewDate.toLocaleDateString()} - ${
                  panel.stage.text
                }`,
                value: panel.id,
              };
            }
          ),
        };
      },
    }),
    interviewId: Property.Dropdown({
      displayName: 'Interview',
      required: false,
      refreshers: ['auth', 'opportunityId', 'panelId'],
      options: async ({ auth, opportunityId, panelId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect first.',
            options: [],
          };
        }
        if (!opportunityId) {
          return {
            disabled: true,
            placeholder: 'Please select a candidate (opportunity).',
            options: [],
          };
        }
        if (!panelId) {
          return {
            disabled: true,
            placeholder: 'Please select an interview panel.',
            options: [],
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${LEVER_BASE_URL}/opportunities/${opportunityId}/panels/${panelId}?include=interviews`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: (auth as LeverAuth).apiKey,
            password: '',
          },
        });
        return {
          options: response.body.data.interviews.map(
            (interview: { id: string; subject: string }) => {
              return { label: interview.subject, value: interview.id };
            }
          ),
        };
      },
    }),
    feedbackFields: Property.DynamicProperties({
      displayName: 'Fields',
      required: true,
      refreshers: ['auth', 'opportunityId', 'panelId', 'interviewId'],
      props: async ({ auth, opportunityId, panelId, interviewId }) => {
        if (!auth || !opportunityId || !panelId || !interviewId) {
          return {
            disabled: true,
            placeholder:
              'Please connect your Lever account first and select an interview',
            options: [],
          };
        }
        const fields: DynamicPropsValue = {};
        try {
          const interviewResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${LEVER_BASE_URL}/opportunities/${opportunityId}/panels/${panelId}?include=interviews`,
            authentication: {
              type: AuthenticationType.BASIC,
              username: (auth as LeverAuth).apiKey,
              password: '',
            },
          });
          const interview = interviewResponse.body.data.interviews.find(
            (interview: { id: string }) =>
              interview.id === (interviewId as unknown as string)
          );
          const feedbackTemplateResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${LEVER_BASE_URL}/feedback_templates/${interview.feedbackTemplate}`,
            authentication: {
              type: AuthenticationType.BASIC,
              username: (auth as LeverAuth).apiKey,
              password: '',
            },
          });
          feedbackTemplateResponse.body.data.fields.map(
            (field: {
              id: string;
              text: string;
              description: string;
              required: boolean;
              type: string;
              options?: { text: string; optionId: string }[];
              scores?: { text: string; description: string }[];
            }) => {
              const mappedField =
                LeverFieldMapping[field.type] || LeverFieldMapping['default'];
              mappedField.buildActivepieceType(fields, field);
            }
          );
        } catch (e) {
          console.error(
            'Unexpected error while building dynamic properties',
            e
          );
        }
        return fields;
      },
    }),
  },
  async run({ auth, propsValue }) {
    const interviewResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEVER_BASE_URL}/opportunities/${propsValue.opportunityId}/panels/${propsValue.panelId}?include=interviews`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: (auth as LeverAuth).apiKey,
        password: '',
      },
    });
    const interview = interviewResponse.body.data.interviews.find(
      (interview: { id: string }) =>
        interview.id === (propsValue.interviewId as unknown as string)
    );

    const feedbackTemplateResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${LEVER_BASE_URL}/feedback_templates/${interview.feedbackTemplate}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: (auth as LeverAuth).apiKey,
        password: '',
      },
    });

    const templateFields = feedbackTemplateResponse.body.data.fields;
    const groupedValues = Object.entries(propsValue.feedbackFields).reduce<
      Record<string, DynamicPropsValue[]>
    >((values, [fieldId, fieldValue]: [string, DynamicPropsValue]) => {
      const canonicalId = fieldId.substring(0, 36);
      values[canonicalId] = values[canonicalId] ?? [];
      values[canonicalId].push(fieldValue);
      return values;
    }, {});

    const payload = {
      baseTemplateId: interview.feedbackTemplate,
      panel: propsValue.panelId,
      interview: propsValue.interviewId,
      fieldValues: Object.entries(groupedValues).map(([fieldId, values]) => {
        const templateField = templateFields.find(
          (tf: { id: string }) => tf.id === fieldId
        );
        const mappedField =
          templateField.type in LeverFieldMapping
            ? LeverFieldMapping[templateField.type]
            : LeverFieldMapping['default'];
        return mappedField.buildLeverType(fieldId, values);
      }),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${LEVER_BASE_URL}/opportunities/${propsValue.opportunityId}/feedback?perform_as=${propsValue.performAs}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.apiKey,
        password: '',
      },
      body: payload,
    });

    return response.body.data;
  },
});
